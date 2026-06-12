# pricespawn — Canlı Fiyat Entegrasyon Rehberi

Bu belge, demo veriyle çalışan siteyi gerçek/güncel fiyatlara geçirmek için yol
haritasıdır. Tasarım baştan "tek değişim noktası" ilkesine göre kuruldu: tüketici
bileşenler (kart, detay, grafik, fiyat etiketi) hiç değişmeden kalır; sadece veri
katmanı değişir.

## 1. İlke — neyi değiştireceksin

Bütün sentetik/demo veri üç dosyada izole:

| Dosya | Şu an (demo) | Canlıda |
|---|---|---|
| `src/lib/exchange.ts` | sabit `USD_TRY = 44.2` | canlı kur API'sinden saatlik çekilen oran |
| `src/data/games.ts` | elle yazılmış fiyatlar | mağaza API'lerinden çekilip cache'lenen fiyatlar |
| `src/lib/history.ts` | seeded sentetik 90 günlük seri | DB'deki gerçek günlük snapshot'lar |

`bestPrice`, `sortedPrices`, `filterSortGames`, `subscriptionValue`, `allTimeLow`,
`sparklinePath` — hepsi bu üçünden okur, dokunulmaz.

## 2. Mağaza API'leri (Türkiye fiyatı)

### Steam
```
GET https://store.steampowered.com/api/appdetails?appids={appid}&cc=tr&l=turkish&filters=price_overview,movies
```
- `data.price_overview`: `currency` ("TRY"), `final` (kuruş cinsinden → /100), `initial`,
  `discount_percent`. Doğrudan TL gelir, kur çevirisi gerekmez.
- **DİKKAT:** `cc=tr` parametresi bazen yok sayılıp isteğin çıktığı IP'nin ülkesine göre
  USD döner (build/cron sunucusu TR dışındaysa). Çözüm: TR bölgesinden çıkış (Vercel
  region `fra1` yetmez — TR proxy/edge ya da bir TR egress servisi) veya en azından
  dönen `currency` alanını doğrulayıp TRY değilse kuru kendin uygula.
- `movies[0].id` → `trailerId` (hover fragmanı) otomatik dolar.
- Rate limit: ~200 istek / 5 dk per IP. Toplu çekimde 1-2 sn aralık + retry.

### Epic Games
```
POST https://graphql.epicgames.com/graphql      (catalog offer query, country: "TR")
```
- Resmi key yok; storefront GraphQL'i kullanılır. `price.totalPrice.fmtPrice` TR
  formatında, `discountPrice` kuruş. Sözleşme/ToS'a dikkat.

### GOG
```
GET https://api.gog.com/products/{id}/prices?countryCode=TR
```
- `_embedded.prices[].finalPrice` "amount currency" (örn. "12.99 USD"). GOG TR'de
  çoğu oyunu USD satar → `exchange.ts` ile TL'ye çevir (mevcut akışla birebir uyumlu;
  `Price.currency = "USD"` zaten destekleniyor).

### Xbox / Microsoft Store
```
GET https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds={id}&market=TR&languages=tr-TR
```
- `DisplaySkuAvailabilities[].Availabilities[].OrderManagementData.Price.ListPrice` (TL).
- Game Pass dahilliği için ayrıca `Properties` / katalog grubu sorgulanır.

### PlayStation Store
- Resmi API yok. `store.playstation.com/tr-tr/product/{id}` HTML'inden `og:price` /
  embedded JSON scrape edilir. Kırılgan, ToS riski.

### Ubisoft Store / EA App
- Public API yok. Store sayfası scrape (Ubisoft+ / EA Play dahilliği de buradan).
  En kırılgan kaynaklar — düşük öncelikli tut, hata toleranslı yaz.

### Abonelik katalogları (Game Pass / PS Plus / EA Play / Ubisoft+ / Luna)
- Game Pass: `catalog.gamepass.com` / Xbox catalog grup ID'leri.
- PS Plus: aylık liste resmi API yok → PlayStation blog/katalog scrape.
- `SUBSCRIPTIONS[id].monthlyTRY` zaten config; sadece dahil-oyun listesi (her oyunun
  `subscriptions[]`) canlı katalogdan güncellenir.

## 3. Döviz kuru

`src/lib/exchange.ts`:
```ts
// Şu an: export const USD_TRY = 44.2;
// Canlı: saatlik cache'lenen oran
export async function getUsdTry(): Promise<number> {
  const r = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=TRY", {
    next: { revalidate: 3600 },
  });
  return (await r.json()).rates.TRY;
}
```
Alternatif kaynak: TCMB günlük XML (`tcmb.gov.tr/kurlar/today.xml`). `toTRY` senkron
kalmak isterse, kuru bir module-level cache'e yaz; fetcher cron'da güncellesin.

## 4. Fiyat geçmişi → gerçek

Sentetik `priceHistory()` yerine DB'den oku.

**Şema (Postgres / Supabase / Vercel Postgres):**
```sql
create table price_history (
  game_id    text not null,
  store      text not null,
  day        date not null,
  try_amount numeric not null,
  primary key (game_id, store, day)
);
create index on price_history (game_id, store, day desc);
```

- Günlük cron her mağaza fiyatını `upsert` eder (gün başına 1 satır).
- `priceHistory(game, store, days)` → son `days` satırı `SELECT`.
- `allTimeLow(game)` → `SELECT min(try_amount) ... where game_id = $1`.
- `isAllTimeLow` → güncel en ucuz ≤ o min.
- İlk açılışta geçmiş boştur; biriktikçe grafik gerçeğe döner. Geçişte sentetik seriyi
  "geçmiş yok" fallback'i olarak bırakabilirsin.

## 5. Vercel cron + cache

`vercel.json`:
```json
{
  "crons": [
    { "path": "/api/refresh/prices",  "schedule": "0 */4 * * *" },
    { "path": "/api/refresh/history", "schedule": "5 3 * * *" }
  ]
}
```

- `app/api/refresh/prices/route.ts`: tüm mağazaları çek → `games` cache'ini (KV/DB)
  güncelle → `revalidateTag("prices")`.
- `app/api/refresh/history/route.ts`: günlük snapshot upsert.
- Okuma tarafı: `unstable_cache(fetcher, keys, { revalidate, tags })` — fiyat saatlik,
  geçmiş günlük. Cron yazınca tag invalidasyonu ile taze.
- Cron route'larını `CRON_SECRET` header ile koru.

## 6. trailerId otomasyonu

Canlı `games` loader, Steam appdetails `movies` filtresinden `movies[0].id` çekip
`trailerId`'yi otomatik doldurur. Mikrofragman URL'i değişmez:
`https://cdn.cloudflare.steamstatic.com/steam/apps/{movieId}/microtrailer.webm`.
404 dönerse `hover-trailer.tsx` zaten sessizce kapak-zoom'a düşüyor.

## 7. Env & limitler

| Sağlayıcı | Base URL | Auth | Limit | Not |
|---|---|---|---|---|
| Steam | store.steampowered.com/api | yok | ~200/5dk/IP | cc=tr doğrula |
| Epic | graphql.epicgames.com | yok (storefront) | belirsiz | ToS |
| GOG | api.gog.com | yok | makul | USD→TL |
| Xbox | displaycatalog.mp.microsoft.com | yok | makul | market=TR |
| PS / Ubisoft / EA | store sayfaları | yok | scrape | kırılgan |
| Kur | exchangerate.host / TCMB | yok / yok | yüksek | saatlik cache |

Env: `DATABASE_URL`, `CRON_SECRET`, (varsa) sağlayıcı proxy URL'leri.

## 8. Geçiş kontrol listesi (sırayla)

1. DB kur (`price_history` + opsiyonel `game_prices` cache tablosu).
2. `exchange.ts` → canlı kur (cache'li).
3. Steam + GOG fetcher (en kolay, açık API) → `games` loader'ı bunlardan doldur.
4. Cron route'ları + cache tag'leri.
5. `history.ts` → DB okuması (sentetik fallback ile).
6. Xbox/Epic fetcher ekle.
7. PS/Ubisoft/EA scrape (en son, hata toleranslı).
8. `trailerId` otomatik doldurmayı loader'a bağla.
9. Abonelik dahil-oyun listelerini canlı katalogtan güncelle.

Her adım bağımsız deploy edilebilir; tüketici bileşenler değişmediği için site her
aşamada çalışır durumda kalır.
