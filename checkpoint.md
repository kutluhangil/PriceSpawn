# PriceSpawn — Checkpoint (canlı çalışma notu)

> Bu dosya gelecekteki oturumlar için. Tarih damgalı, anlık fotoğraf — dosya/satır
> iddialarını koda karşı doğrula. Son güncelleme: **2026-06-15**.

## Ürün
**pricespawn** — Türkiye oyun fiyat karşılaştırma sitesi. Steam, Epic, GOG, Xbox,
PlayStation, Ubisoft, Humble fiyatlarını **TL** olarak canlı kurla karşılaştırır.
Ek: abonelik değeri, ücretsiz oyunlar, takip listesi + fiyat alarmı (push + e-posta),
indirim takvimi, fiyat geçmişi + ATL, Al/Bekle verdikti, benzer oyunlar, bundle takibi,
inceleme/puan (Steam % + Metacritic).

## Stack
- **Next 16.2.9** App Router (Turbopack), React 19, Tailwind v4, TypeScript.
- **Neon Postgres** (canlı fiyat/geçmiş/cache). **ITAD API** (gerçek TR fiyat + ATL).
  Steam appdetails/appreviews (keysiz). PS Store scrape. Resend (e-posta). web-push (VAPID).
- Vercel deploy: proje `pricespawn` (kutluhans-projects-93876a9e). GitHub `kutluhangil/PriceSpawn`.
- **AGENTS.md uyarısı:** "Bu bildiğin Next değil" — kod yazmadan `node_modules/next/dist/docs` oku.
- **Tuzak:** next/image `quality` değeri `next.config images.qualities` içinde olmalı yoksa
  HTTP 400 → buğulu görsel. Çözüldü: `qualities: [75, 90]`. Buğu varsa ÖNCE `/_next/image?...&q=N` curl'le.

## Veri modeli (KRİTİK)
- `src/data/games.ts` — `GAMES`: ~2487 **metadata-only** (prices:[]). Gerçek fiyatlar
  `/api/prices`'tan canlı enjekte (`src/lib/live.ts applyLive`). Tip: `Game{id(=steam appid
  veya slug), slug, title, coverUrl, genres[], score, releaseYear, prices[], subscriptions[], trailerId?, unreleased?}`.
- `coverUrl` = `cover(appid)` → `shared.fastly.steamstatic.com/store_item_assets/steam/apps/<appid>/header.jpg`.
  Bazıları hash-dizinli akamai URL (capsule/library_hero hash dizininde YOK; appid app-path'te var).
- Fiyat DB: `game_prices(slug,store,amount,currency,original_amount,discount_percent,url,updated_at)`. FX: `fx_rate`.
- **Abonelikler:** `src/lib/subscriptions.ts` (`SubscriptionMeta: id,label,monthlyTRY,yearlyTRY?,accent,url`).
  Oyunlar `subscriptions[]` ile etiketli (küratörlü, örn. EA_PLAY_SLUGS). Değer hesabı `src/lib/sub-value.ts`.
- **Ücretsiz:** Epic canlı (`/api/free`) + Amazon Luna küratörlü (`src/data/luna.ts`).
- **İndirim takvimi:** `src/data/sales.ts` (küratörlü/projeksiyon).

## Canlı veri pipeline
- `/api/prices` (oku), `/api/refresh` (ITAD fiyat+ATL, cron), `/api/refresh-ps` (PS scrape, sadece
  prod IP çalışır), `/api/free` (Epic), `/api/game` (Steam medya+inceleme cache), `/api/history`,
  `/api/notify` (cron: push + e-posta alarmı), `/api/bundles` (ITAD).
- Katalog büyütme: `gen2.py` (ITAD listelerinden id toplar → games.ts GENERATED).

## Bu oturumda yapılanlar (2026-06-14/15)
- Billboard: küratörlü popüler AAA (FEATURED_SLUGS), premium oklar, library_hero (appid'den, 1920px), q=90 fix.
- Footer redesign, indirim takvimi cila, çerez/KVKK banner, legal sayfalar (/hakkinda /gizlilik /kullanim-sartlari).
- JSON-LD (WebSite+Organization + VideoGame+BreadcrumbList), Vercel Analytics + Speed Insights.
- Al/Bekle verdikti (`lib/deal-verdict.ts`), chart ATL çizgisi, benzer oyunlar (`lib/related.ts`).
- PWA (manifest + install banner + icon-192/512), fiyat-düşüşü ticker.
- E-posta alarmı (Resend, double opt-in: `email_subs`/`email_watches`, /api/email/*). RESEND_API_KEY + EMAIL_FROM env ekli (onboarding@resend.dev — domain doğrulanınca fiyat@pricespawn.com yapılacak).
- İnceleme/puan (Steam % + Metacritic, `/api/game` reviews), bundle takibi (`/api/bundles` ITAD).

## AÇIK GÖREVLER (2026-06-15 — kullanıcı talebi)
**Kural: sitedeki TÜM veri gerçek olacak. Sahte/demo veri kalmayacak — tek bir tane bile. Olanı kaldır.**
1. **Ücretsiz oyunlar görselleri gelmiyor** (Prime Gaming/Luna gradient gösteriyor). Düzelt.
2. **Abonelik Değeri sayfası:** abonelik planları/kademeleri ekle (Game Pass: Essential/Premium/Ultimate/PC vb.;
   EA Play/EA Play Pro var). Oyun **sayıları gerçek** olsun (Game Pass ~400+, PS Plus Extra yüzlerce — şu an 12).
   Oyun listeleri + değerleri gerçek (internetten). PS aynı şekilde.
3. **Her oyun detayına satın alma linkleri** — şu an hiçbirinde yok. Tek tek hepsine.
4. **Kütüphane genişlet** — Game Pass / Ubisoft+ / EA / PS için TAM liste (internetten araştır). Steam zaten büyük.
5. **Demo/sahte veri temizliği** — varsa kaldır.

## Yaklaşım
Ajanlı: her ajan bir alan keşfeder (salt-okunur), sonra sıralı implement. Gerçek veri kaynakları:
Game Pass `catalog.gamepass.com/sigls/v2` + `displaycatalog.mp.microsoft.com`; PS Plus/EA/Ubisoft için
en iyi gerçek kaynak araştırılıyor (ITAD abonelik verisi var mı dahil).
