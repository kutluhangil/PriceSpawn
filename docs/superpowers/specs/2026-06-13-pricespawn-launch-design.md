# PriceSpawn Launch Turu — Tasarım Spec'i

**Tarih:** 2026-06-13
**Durum:** Onaylandı (kullanıcı, sohbet içinde)
**Bağlam:** Site LinkedIn'de public paylaşılacak. Mevcut: 549 oyun, ITAD (6 PC
mağaza) + PlayStation canlı TR fiyatları, gerçek tarihî dip, canlı Epic ücretsiz
oyunlar, animasyonlu takımyıldız arka plan.

## Amaç

Launch öncesi 4 iş: (1) tek bir sahte sayı kalmasın — tüm fiyatlar gerçek/canlı,
(2) her fiyat o mağazanın oyun sayfasına link, (3) katalog 1500+ oyun, (4) premium
tasarım (zengin detay sayfası + cila).

## Kullanıcı kararları

| Karar | Seçim |
|---|---|
| Sahte veri | Tam katı — sadece gerçek canlı fiyat; demo-only satır gizli; yoksa "fiyat yok" |
| Katalog hedefi | Maksimum (1500+) |
| Mağaza linkleri | Her yerde (detay satırı + kart en ucuz + billboard) |
| Premium tasarım | Hepsi: zengin detay + mikro-etkileşim + tipografi + rozetler |

## Mimari ilkeler
- Fiyatlar tek kaynaktan: canlı `/api/prices` (DB). Katalog yalnız meta veri.
- Saf fonksiyonlar test edilir. Demo fiyat kodda yok.
- Her faz bağımsız deploy edilebilir.

---

## FAZ 1 — Sıfır sahte veri + mağaza linkleri

### 1A. Demo fiyatları kaldır
- `src/data/games.ts`: `Game` tipinden `prices` zorunluluğu kaldırılır; oyunlar
  meta veri taşır (id/appid, slug, title, coverUrl, genres, score, releaseYear,
  subscriptions, trailerId?, unreleased?). `makeGame` üreteci `prices: []` üretir
  (demo fiyat yok); hand-written 120 oyunun `prices` dizileri boşaltılır.
- Fiyat artık yalnız canlı `/api/prices`'tan gelir; `applyLive` boş `game.prices`'a
  canlı fiyatları enjekte eder (mevcut mantık: eşleşen store'u replace/ push).
- **Gösterim durumları** (`game-detail`, `game-card`, `billboard`, arama, palet):
  - Canlı veri henüz yüklenmedi → fiyat alanında **shimmer** (yükleniyor).
  - Yüklendi + fiyat var → gerçek fiyatlar.
  - Yüklendi + hiç fiyat yok → "Fiyat bulunamadı" (i18n `noPriceFound`).
  - `unreleased` → mevcut "Çıkmadı · yıl" (değişmez).
- `liveUpdatedAt` (providers) "yüklendi mi" sinyali olarak kullanılır; ek olarak
  providers'a `priceLoaded: boolean` eklenir (fetch tamamlandı).
- **Test:** `tests/data.test.ts` fiyat kontrolünü kaldırır; meta-veri kontrolü
  kalır (≥40 oyun, benzersiz slug, score 0-100, genres dolu, appid'li olanlar
  numeric id). `price.test.ts`/`filters.test.ts` canlı-enjekte edilmiş `prices`
  ile çalıştığından, testlerde örnek oyunlara prices elle verilir (zaten öyle).

### 1B. Mağaza derin-linkleri
- DB `game_prices`'a `url text` kolonu eklenir.
- `itadPrices` deal'dan `url` (itad.link → mağaza) yakalar; refresh route yazar.
- `refresh-ps` PS product URL'sini yazar:
  `https://store.playstation.com/tr-tr/product/{productId}`.
- Steam: canlı url yoksa `game.id` (appid) ile
  `https://store.steampowered.com/app/{appid}` türetilir (client-side fallback).
- `/api/prices` payload'una `url` eklenir (her store fiyatında). `applyLive` bunu
  `Price`'a taşır (`Price.url?: string`).
- `src/lib/store-url.ts`: `storeUrl(game, price)` → canlı url ∥ Steam-appid türevi
  ∥ null. UI yardımcı.
- **Gösterim:** detay fiyat satırı, kart "en ucuz" bloğu, billboard fiyatları —
  url varsa `<a target="_blank" rel="noopener noreferrer">`, yoksa düz metin.
  Kart link iç-içe olmaması için: kartın kendisi `/oyun/[slug]`'a gider; "en ucuz"
  fiyatı ayrı küçük "Mağazada aç ↗" linki olur (kart linki içinde nested anchor
  yerine `e.stopPropagation` + `window.open` ya da kartı `<div>` + ayrı linkler).
  Detayda satırlar zaten bağımsız → doğrudan `<a>`.

---

## FAZ 2 — Zengin detay sayfası

- `src/app/api/game/route.ts`: `?appid=` → Steam `appdetails`
  (`filters=basic` veya tam) → `{ description, screenshots[], tags[], background }`.
  UA header + DB cache (`game_meta(appid, json, updated_at)`), 7 gün.
- `src/components/game-media.tsx`: ekran görüntüsü galerisi (yatay ray + tıkla
  büyüt/lightbox), `next/image` ile optimize.
- `src/components/game-about.tsx`: kısa açıklama (HTML temizlenip düz metin) +
  Steam etiketleri (chip).
- `game-detail` bunları başlık ile fiyatlar arasına ekler. appid yoksa (GTA VI gibi)
  galeri/açıklama atlanır. Yükleme: skeleton.

---

## FAZ 3 — Katalog 1500+

- `scripts`/generator (mevcut `gen2.py` mantığı): ITAD `deals/v2` (trending) +
  popülerlik için ek sayfalar → `games/info/v2` (appid, başlık, tag→TR tür,
  inceleme puanı, yıl) → meta-veri spec. Kapak 200 doğrulanır, dedup (appid+slug).
  Hedef ~950 yeni (toplam ~1500). Demo fiyat YOK (Faz 1 gereği).
- `games.ts` GENERATED listesine eklenir (meta-only).
- Tohumlama: `/api/refresh` (ITAD fiyat+dip+kur) + `/api/refresh-ps` (PS) Vercel'den
  fazlı çalıştırılır (cache'li lookup'lar; PS nazik). 1500 oyun lookup ilk turda
  uzun → birden çok çağrı.
- Cron'lar zaten günlük; yeni oyunlar otomatik fiyatlanır.

---

## FAZ 4 — Premium tasarım cilası

- **Rozetler:** "EN UCUZ", "🔥 Tarihî dip", "%X tasarruf" (regular vs current) daha
  belirgin/premium; tutarlı yerleşim.
- **Mikro-etkileşim:** buton/hover/transition ince ayar; kart hover derinliği;
  fiyat `CountUp` tutarlılığı; reduced-motion saygısı korunur.
- **Tipografi + boşluk:** başlık ölçeği, satır yüksekliği, bölüm boşlukları,
  hizalama tutarlılığı (frontend-design skill ile).
- Dark/light her ikisinde kontrol; mobil.

---

## Hata / kenar durumları
- `/api/prices` veya `/api/game` başarısız → demo'ya DÜŞMEZ (demo yok); fiyat
  "Fiyat bulunamadı", medya gizli. Site çökmemeli.
- Nested anchor (kart içinde mağaza linki) → DOM-geçerli yapı (kart `<div>` +
  bağımsız linkler ya da stopPropagation).
- Steam appdetails UA gerektirir (trailer route'taki gibi).
- Yüklenme yarış durumu: `priceLoaded` false iken shimmer, true iken sonuç.

## Test
- `data.test`: meta-veri (slug benzersiz, score aralığı, genres dolu).
- `store-url.test`: `storeUrl()` canlı/Steam-fallback/null.
- Mevcut `price/filters/sub-value/watchlist/history` testleri korunur (örnek
  oyunlara fiyat elle verilir).
- Görsel doğrulama: Playwright — detay galeri, mağaza linki tıklama (yeni sekme),
  shimmer→fiyat, "fiyat yok" durumu, rozetler.

## Kapsam dışı (sonra)
- EA App fiyatları (API yok).
- Kullanıcı hesabı / gerçek e-posta alarmı.
- Fiyat geçmişi eğrisi gerçek snapshot'larla zaten birikiyor (değişmez).
