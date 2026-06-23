# Steam Wishlist Import — Tasarım Spec'i

**Tarih:** 2026-06-24
**Durum:** Onaylandı (kullanıcı)

## Amaç

Kullanıcı bir Steam profil/wishlist URL'i (veya vanity adı / SteamID64) yapıştırır. Public wishlist'i çekeriz, bizde takip ettiğimiz her oyunun **mevcut en iyi Türkiye fiyatını + indirimini** compact bir fırsat grid'inde gösteririz. Login yok. Sahte veri yok.

ITAD'ın en güçlü retention özelliğinin (wishlist sync) keysiz, hesap gerektirmeyen bir versiyonu.

## Kullanıcı kararları (brainstorming)

- **Giriş:** Ana sayfada arama kutusunun yanında küçük bir "Steam wishlist'ini içe aktar" girişi → sonuçlar `/liste` sayfasına yönlenir.
- **Sonuç içeriği:** Compact fırsat grid + üst özet. Her oyun: kapak + en iyi TR fiyat + indirim% + mağaza, en büyük indirim üstte. Üst özet: kaç oyun, kaçı indirimde, tümünü en ucuz almak kaç ₺. Takip etmediğimiz oyunlar tek tek gizli, "X oyunu henüz takip etmiyoruz" sayısı olarak.
- **Routing:** Paylaşılabilir kanonik URL `/liste?id=<steamid64>`. Sayfa dinamik (canlı fiyat). localStorage son içe aktarılan listeyi hatırlar (tek tıkla geri dön).
- **Ekstralar (hepsi):** Toplu fiyat alarmı, sıralama seçenekleri, "sadece indirimdekiler" filtresi, mağaza filtresi.

## Mevcut durum (keşif)

`src/app/api/steam-wishlist/route.ts` kısmen var:
- `resolveSteamId(input)` — SteamID64 / `steamcommunity.com/profiles/<17>` / `steamcommunity.com/id/<vanity>` / ham vanity'yi keysiz `…/id/<vanity>/?xml=1` ile SteamID64'e çözer.
- Wishlist appid'lerini keysiz `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=` ile çeker.
- **Eksik:** sadece bundled `GAMES` (~2739) dizisine eşliyor (tam DB katalog 10.405 değil); fiyat yok; UI yok.

DB: `catalog` tablosunda `appid` (text) + `slug` var. Fiyatlar `game_prices` (slug'a bağlı, store/price_try/discount). `src/app/api/catalog-browse/route.ts` zaten slug başına `min_try`/`max_disc` üreten bir CTE (`pr`) + fx_rate okuması kuruyor — wishlistDeals aynı pattern'i kullanır.

## Mimari

### Veri akışı

```
Ana sayfa <WishlistImport> (URL / vanity / steamid64)
  → GET /api/steam-wishlist?input=…   → { ok, steamid, total } veya { ok:false, reason }
  → ok ise router.push(/liste?id=<steamid64>)
  → ok değilse inline hata (bad_input / not_found / empty_or_private)

/liste?id=<steamid64>  (server component, force-dynamic, noindex)
  → lib/wishlist.fetchWishlistAppids(steamid)     [keysiz IWishlistService]
  → lib/wishlist.wishlistDeals(appids)            [TEK SQL: catalog WHERE appid = ANY + fiyat CTE]
  → lib/wishlist.summarize(items, totalWishlist)
  → render: özet bandı + <WishlistGrid items> (client island)

/liste?q=<ham input>  → server resolve → redirect(/liste?id=<steamid64>)  [kanonikleştirme]
```

`/liste` server component olduğu için lib fonksiyonlarını doğrudan çağırır (API round-trip yok). `/api/steam-wishlist` yalnızca ana sayfa resolve'u (ve ileride client refresh) için kullanılır.

### Birimler

**`src/lib/wishlist.ts`** (yeni — saf/test edilebilir çekirdek)
- `resolveSteamId(input: string): Promise<string | null>` — mevcut route'tan taşınır.
- `fetchWishlistAppids(steamid: string): Promise<string[] | null>` — keysiz IWishlistService; null = private/boş/hata.
- `wishlistDeals(appids: string[]): Promise<WishlistItem[]>` — tek SQL: `catalog c` `WHERE c.appid = ANY($1)` LEFT JOIN fiyat CTE (`game_prices` üzerinden `min_try`, `max_disc`, en ucuz mağaza). fx_rate ile ₺. Dönüş: `{ slug, title, cover, appid, priceTRY|null, discount|null, store|null, free }`. Varsayılan sıralama: `max_disc DESC NULLS LAST, score DESC`.
- `summarize(items, totalWishlist): WishlistSummary` — `{ matched, onSale, untracked, cheapestCartTRY }`. cheapestCart = priceTRY dolu olanların toplamı. untracked = totalWishlist − matched.

**`src/app/liste/page.tsx`** (yeni — server component)
- `searchParams` id/q çöz; `?q=` ise resolve + `redirect`; id geçersizse hata durumu.
- `export const dynamic = "force-dynamic"`; `metadata: { robots: { index: false } }`.
- Özet bandını render eder, `WishlistGrid`'e items + summary geçer.
- Boş/private/hata için dostça mesaj durumları.

**`src/components/wishlist-grid.tsx`** (yeni — client island)
- Sıralama: indirim% (default) / fiyat artan / fiyat azalan / ad / ₺-tasarruf.
- "Sadece indirimdekiler" toggle (discount > 0).
- Mağaza filtresi (en iyi fiyatın mağazası).
- Toplu alarm: "Tümünü / seçilenleri alarma ekle".
- Kart render: mevcut `ResultCard` yeniden kullanılır.

**`src/components/wishlist-import.tsx`** (yeni — client, ana sayfa)
- Arama yanında küçük giriş + buton. Resolve çağrısı, loading/hata, başarıda `router.push`.
- localStorage `pricespawn-wishlist` son steamid64'ü saklar → "Son listeme dön" kısayolu.

**`src/app/api/steam-wishlist/route.ts`** (revize)
- Sadece resolve + total döndürecek şekilde sadeleştir: `{ ok, steamid, total, reason? }`. Ağır DB sorgusu `/liste` server tarafında.
- `resolveSteamId` artık `lib/wishlist`'ten import edilir (kopya kalkar).

### Toplu fiyat alarmı

Mevcut altyapı: `email_subs`/`email_watches` (+ `/api/email/subscribe`) ve `push_subs`/`push_watches` (+ `/api/push`). `/api/notify` cron'u zaten watch'ları kontrol eder.
- "Tümünü/seçilenleri alarma ekle": her oyun için `target = bugünkü en iyi fiyat` ile watch ekle (sonraki düşüşte bildir). Fiyatsız oyun atlanır.
- Kullanıcının e-posta veya push'u yoksa önce onu kur (mevcut `use-email-alerts` / `use-push` akışı). v1: kullanıcının zaten kurulu kanalına toplu ekleme; kurulu değilse yönlendir.
- Toplu uç: `/api/email/watch-bulk` (POST `{ email, items: [{slug, target}] }`) — mevcut tek-watch mantığını batch'ler. Push için benzer şekilde mevcut `/api/push/subscribe` watch dizisini zaten kabul ediyor (kontrol et, gerekirse genişlet).

## Hata yönetimi (sahte veri yok)

- `bad_input` (boş/anlamsız), `not_found` (vanity çözülemedi), `empty_or_private` (wishlist boş/gizli), Steam API down → her biri için dostça inline TR mesajı.
- Katalogda olmayan wishlist oyunları → fiyat uydurulmaz; "X oyunu henüz takip etmiyoruz" sayısı.
- Katalogda ama fiyatsız → mevcut "Fiyat bulunamadı" / "Ücretsiz" mantığı; en-ucuz-sepet toplamına dahil edilmez.

## Gizlilik / SEO

- SteamID64 zaten public bilgi (wishlist public olmalı). `/liste` `noindex` (rastgele wishlist sayfaları indekslenmesin). Sitemap'e eklenmez.

## Test

- `resolveSteamId` — steamid64 / profiles URL / id-vanity URL / ham vanity / geçersiz girişler (regex dalları).
- `summarize` — matched/onSale/untracked sayıları + cheapestCart toplamı (fiyatsız hariç).
- Grid saf yardımcıları — sıralama karşılaştırıcıları + filtre predikatları.
- `wishlistDeals` — sorgu sonucu → WishlistItem şekli (mock satırlarla).

## i18n

Yeni TR/EN anahtarları: import placeholder, buton, özet metinleri ("{n} oyun · {m} indirimde · sepet {₺}"), untracked satırı, sıralama/filtre etiketleri, toplu-alarm, hata mesajları.

## Kapsam dışı (YAGNI)

- Tam mağaza dökümü (her oyunda tüm mağaza fiyatları) — compact tek "en iyi fiyat" yeterli.
- Steam kütüphane (sahip olunan oyunlar) importu — sadece wishlist.
- Bölgesel fiyat karşılaştırma — sahte-veri riski.
- Hesap/giriş, kalıcı sunucu-tarafı liste saklama — localStorage yeterli.
