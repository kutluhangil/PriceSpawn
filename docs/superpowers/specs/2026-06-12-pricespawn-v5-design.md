# pricespawn v5 — Özellik + Tasarım Yükseltmesi Spec'i

**Tarih:** 2026-06-12
**Durum:** Onaylandı (kullanıcı, sohbet içinde)
**Önceki:** v4 sinematik tasarım (aurora arama + billboard), 120 oyunluk demo katalog

## Amaç

pricespawn'a değer üreten 6 özellik + 10 tasarım yükseltmesi eklemek; hepsi demo
veriyle çalışacak ama canlı API'ye geçişe hazır yapıda. Ayrıca canlı entegrasyonu
yönlendiren bir rehber doküman.

## Kararlar (kullanıcı onaylı)

| Karar | Seçim |
|---|---|
| Fiyat geçmişi verisi | Seeded sentetik (slug+store tohumlu 90 günlük dalgalanma) |
| Fiyat alarmı | localStorage takip listesi (backend yok; "alarm kuruldu" UI) |
| Hover video | Steam mikrofragman (movie id'li küratörlü alt küme) + kapak-zoom fallback |

## Mimari ilkeler

- **Tek swap noktası:** Tüm sentetik veri (`history.ts`, `free.ts`) ve kur (`exchange.ts`)
  izole; canlıya geçişte sadece bu dosyalar değişir, tüketici bileşenler aynı kalır.
- **Saf fonksiyonlar test edilir:** history determinizmi, allTimeLow, filtre, abonelik
  değeri, watchlist mantığı.
- **Küçük odaklı dosyalar:** her yeni lib bir sorumluluk; bileşenler tek iş.

---

## Temel taş: `src/lib/history.ts`

Sparkline, fiyat grafiği ve tarihî düşük rozetinin **hepsi** buna dayanır.

```ts
export interface PricePoint { day: number; date: string; tryAmount: number; }

// slug+store'dan deterministik tohum (mulberry32 / xfnv1a). Aynı girdi → aynı seri.
export function priceHistory(game, store, days = 90): PricePoint[]
//   - sonu game'in o mağazadaki güncel TRY fiyatına sabitlenir (toplam tutarlılık)
//   - rastgele yürüyüş + ara ara indirim çukurları (steam-vari kampanya sıçramaları)
//   - tüm noktalar > 0

export function allTimeLow(game): { tryAmount: number; store: StoreId; day: number }
export function isAllTimeLow(game): boolean  // güncel en ucuz <= geçmiş min (±%2 tolerans)
export function sparklinePath(points, w, h): string  // SVG path "M..L.."
```

Determinizm kritik: SSR ve client aynı seriyi üretmeli (hydration uyumu). Tohum
yalnız `slug`+`store`'dan; `Math.random`/`Date.now` kullanılmaz.

---

## Özellikler

### 1. Fiyat geçmişi grafiği (detay sayfası)
- `src/components/price-chart.tsx`: SVG alan grafiği, X=gün Y=TL.
- Mağaza seçici sekmeler (oyunun mağazaları). Varsayılan: en ucuz mağaza.
- İndirim çukurları işaretlenir; hover'da tarih+fiyat tooltip.
- Altında "Tarihî en düşük: ₺X (N gün önce)" satırı.

### 2. Tarihî en düşük rozeti
- `src/components/atl-badge.tsx`: `isAllTimeLow(game)` true ise.
- Kartlarda küçük "🔥 Tarihî dip", detayda en ucuz satırında belirgin rozet.

### 3. Filtre + sıralama — `/oyunlar`
- `src/lib/filters.ts`: saf `filterSortGames(games, opts)`.
- Facetler: tür (çoklu), mağaza (çoklu), abonelik (çoklu), "sadece indirimde",
  fiyat aralığı (TL min-max).
- Sıralama: indirim ↓, fiyat ↑/↓, puan ↓, çıkış yılı ↓, ad A-Z.
- `src/components/filter-bar.tsx` (chip + select), `useGameFilters` hook (URL'e
  yansımaz; state). Sonuç GameCard grid'i. Boş sonuç durumu.
- Navbar'a "Tüm Oyunlar" linki; mobil alt nav'a girer.

### 4. Fiyat alarmı — `/takip`
- `src/lib/watchlist.ts` + `useWatchlist` hook: localStorage `pricespawn-watch`
  → `{ slug, targetTRY }[]`. SSR-güvenli (mount sonrası okur).
- Kart/detayda "Takip Et" kalp/zil butonu (toggle). Eklenince toast "Alarm kuruldu".
- `/takip` sayfası: takip edilen oyunlar, her birinde hedef fiyat input'u; güncel
  en ucuz ≤ hedef ise "🎯 Hedefe ulaştı" vurgusu. Boş durum: "Henüz takip yok".
- Gerçek bildirim yok (backend yok) — UI hazır; canlıda e-posta/push eklenir.

### 5. Ücretsiz oyunlar — `/ucretsiz` + ana sayfa şeridi
- `src/data/free.ts`: `FreeOffer[] = { title, coverUrl, platform, freeUntil, normalTRY, slug? }`.
  Demo: Epic haftalık, PS Plus aylık, Prime Gaming, GOG bedava. `slug` varsa katalog
  oyununa link, yoksa sadece kart.
- `platform` rozeti + "Bitişe N gün" geri sayım. Süresi geçmiş teklif gizlenir
  (freeUntil < bugün). Bugün = `new Date()` (client-side, hydration için
  `suppressHydrationWarning` veya mount sonrası hesap).
- Ana sayfada şerit; `/ucretsiz` tam liste.

### 6. Abonelik değer hesabı — `/abonelikler`
- `src/lib/sub-value.ts`: her `SubscriptionId` için katalogdaki dahil oyunları topla,
  her birinin `bestPrice` TRY'sini topla → `{ count, totalTRY, monthlyTRY, ratio }`.
- `src/components/sub-value-card.tsx`: "Bu abonelikte ₺X değerinde N oyun · Aylık ₺549
  · ~M ay sonra başa baş". Dahil oyunların mini kapak grid'i (→ detaya link).

---

## Tasarım yükseltmeleri

### Gerçek mağaza/abonelik logoları
- `src/components/store-logo.tsx`: her StoreId + SubscriptionId için inline SVG marka
  işareti (basit, tanınır; renk = mevcut accent). Renk noktalarının yerine geçer
  (kart, detay, footer, billboard).

### Cmd+K komut paleti
- `src/components/command-palette.tsx`: global `keydown` (⌘/Ctrl+K) açar, Esc kapatır.
- Ortada modal + arka plan blur. Mevcut `searchGames`; ok tuşu + Enter → detay.
- Navigasyon kısayolları da listelenir (Tüm Oyunlar, Ücretsiz, Abonelikler, Takip).

### Kart sparkline
- `src/components/sparkline.tsx`: GameCard'da en ucuz mağazanın 90 günlük mini çizgisi
  (`sparklinePath`). Renk: düşüş yeşil. Yükseklik ~28px.

### Fiyat sayma animasyonu
- `src/components/count-up.tsx`: değer 0→hedef, ~600ms ease-out, `requestAnimationFrame`.
  `prefers-reduced-motion`'da anında. Detay fiyatları + billboard'da kullanılır.
  Format `formatTRY` korunur (animasyon ara değerlerde de TL formatı).

### Skeleton / shimmer
- `src/components/skeleton.tsx` + globals shimmer keyframe. CoverImage yüklenene kadar
  shimmer placeholder gösterir (mevcut gradient fallback hata durumunda kalır).

### Yapışkan en ucuz CTA (detay)
- Detayda kaydırınca altta sabit çubuk: "En ucuz ₺X · {mağaza}'da aç" → mağaza url'i
  yoksa sadece bilgi. `IntersectionObserver` ile fiyat listesi görünürken gizli,
  kaybolunca görünür. Mobilde alt nav üstünde.

### Fırsat radarı (ana sayfa)
- `src/components/deal-radar.tsx`: indirimli oyunlar indirim %'sine göre renklenen
  ısı blokları (düşük=soğuk, yüksek=sıcak yeşil-sarı). Hover'da oyun adı+fiyat. Grid.

### Mobil alt navigasyon
- `src/components/bottom-nav.tsx`: `< sm` görünür, sabit alt bar. Sekmeler:
  Ara (paleti açar) · Fırsatlar (`/#deals`) · Ücretsiz (`/ucretsiz`) · Takip (`/takip`).
  Aktif sekme vurgulu.

### Üç yönlü tema
- providers: `theme: "dark"|"light"|"system"`; `system` → `matchMedia` dinler, canlı
  değişir. Toggle 3'lü döngü (ay→güneş→otomatik). Init script `system`'i çözer.
  localStorage `pricespawn-theme` (mevcut `hdu-theme` yerine — geçiş notu).

### Hover video önizleme
- Game'e opsiyonel `trailerId?: string` (Steam movie id). Küratörlü alt küme (~15-20
  popüler oyun) için doldurulur; her id `microtrailer.webm` 200 doğrulanır.
- `src/components/hover-trailer.tsx`: hover'da `https://cdn.cloudflare.steamstatic.com/
  steam/apps/{trailerId}/microtrailer.webm` lazy yükle, muted/loop oynat; `trailerId`
  yoksa veya video hata verirse kapak-zoom fallback. `prefers-reduced-motion`'da kapalı.

---

## Veri modeli değişiklikleri

- `Game`'e opsiyonel `trailerId?: string` (mevcut alanlar değişmez; testler geçer).
- Yeni: `src/data/free.ts` (`FreeOffer[]`).
- i18n: yeni anahtarlar (tr.ts + en.ts) — filtre/sıralama etiketleri, takip, ücretsiz,
  abonelik değeri, palet, tema modları, tarihî dip, geri sayım.

## Sayfalar (yeni)
`/oyunlar` (filtre) · `/ucretsiz` · `/abonelikler` · `/takip`. Hepsi client bileşeni
(filtre/localStorage/tarih için). SEO metadata statik.

## Hata / kenar durumları
- Filtre boş sonuç: boş durum mesajı.
- Takip listesi boş: yönlendiren boş durum.
- Süresi geçmiş ücretsiz teklif: listeden düşer.
- Hover video 404/yoksa: sessizce kapak-zoom.
- localStorage erişilemezse (gizli mod): try/catch, takip özelliği sessiz devre dışı.
- Hydration: tüm tarih/localStorage bağımlı değerler mount sonrası okunur.

## Test
- `tests/history.test.ts`: determinizm (aynı slug+store → aynı seri), son nokta =
  güncel fiyat, tüm noktalar > 0, allTimeLow ≤ tüm noktalar, isAllTimeLow mantığı.
- `tests/filters.test.ts`: tür/mağaza/abonelik/indirim/fiyat filtreleri, her sıralama.
- `tests/sub-value.test.ts`: dahil oyun sayımı + toplam değer + oran.
- `tests/watchlist.test.ts`: ekle/çıkar/hedef, hedefe-ulaştı kontrolü (saf fonksiyon).
- `tests/data.test.ts` korunur; `free.ts` için: tüm freeUntil geçerli tarih, slug
  varsa katalogda mevcut.

## Canlı API rehberi — `docs/LIVE_API_INTEGRATION.md`
Ayrı deliverable. İçerik:
- **Mağaza API'leri:** Steam `appdetails?appids=&cc=tr&l=turkish` (NOT: cc=tr bazen
  geo'ya göre USD dönebilir — TR egress/proxy gerekebilir, doğrula); Epic GraphQL
  (`graphql.epicgames.com`, country=TR); GOG `api.gog.com/products`; Xbox displaycatalog
  (market=TR); Ubisoft/EA scraping notu.
- **Tek swap noktaları:** `exchange.ts` (canlı USD/TRY kuru API), `history.ts` (gerçek
  günlük snapshot sorgusu), `games.ts` → fetcher + cache katmanı.
- **Snapshot şeması:** `price_history(game_id, store, day, try_amount)` tablo; günlük
  cron yazar; `priceHistory()` bunu okur. (DB: Vercel Postgres / Supabase.)
- **Vercel cron + cache:** `vercel.json` cron → API route → mağaza fetch → upsert +
  `unstable_cache`/runtime cache (saatlik fiyat, günlük snapshot).
- **trailerId:** canlıda `appdetails ...&filters=movies` → `movies[0].id` otomatik dolar.
- **Env / rate-limit:** her sağlayıcı için key, çağrı sıklığı, backoff.

## Kapsam dışı (gelecek)
- Gerçek e-posta/push bildirim (backend gelince).
- Gri pazar (Eneba/Kinguin) key fiyatları.
- Fiyat geçmişinin gerçek verisi (canlı API işi).

## Fazlama (plan bunu izler)
1. **Temel:** `history.ts` + testler, `trailerId` alanı + küratörlü id'ler.
2. **Saf libler:** `filters.ts`, `sub-value.ts`, `watchlist.ts` + testler.
3. **Veri:** `free.ts` + test, i18n anahtarları.
4. **Atomik bileşenler:** store-logo, sparkline, count-up, skeleton, atl-badge, hover-trailer.
5. **Sayfalar/bölümler:** `/oyunlar`, `/ucretsiz`, `/abonelikler`, `/takip`, deal-radar,
   price-chart, sticky CTA, command-palette, bottom-nav, üç yönlü tema.
6. **Rehber dokümanı** + final doğrulama (test/build/lint/screenshot/deploy).
