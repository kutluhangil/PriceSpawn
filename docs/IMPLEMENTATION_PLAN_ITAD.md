# Uygulama Planı — ITAD veri genişletme (2026-06-15)

Hepsi gerçek API ile doğrulandı (key, country=TR). Faz faz uygulanacak.

## Faz 1 — Gerçek fiyat geçmişi (`/games/history/v2`)
- Sorun: grafik şu an DB `price_history` (seyrek günlük snapshot).
- ITAD `history/v2?id=&country=TR&since=` → `[{timestamp, shop:{id,name}, deal:{price:{amount,currency}, cut}}]`.
- `fetchers.ts itadHistory(id, key, since)`; `/api/history` route'u: slug→appid→itad_id (itad_map), ITAD geçmişini çek, shop→bizim store (ITAD_SHOP_TO_STORE) eşle, güne indir (gün başına son fiyat), `{byStore,days}` döndür. DB fallback kalsın. Cache s-maxage.
- price-chart.tsx değişmez (aynı payload). Sonuç: anında yıllarca gerçek geçmiş.

## Faz 2 — Aktif Paketler sayfası (`/bundles/v1`)
- ITAD `bundles/v1?country=TR&limit=&offset=` → `{list:[{id,title,page:{name},url,details,publish,expiry,counts:{games}}]}`.
- `/api/bundles-list` route (cache). Yeni sayfa `/paketler` + içerik bileşeni + nav/footer link + i18n. Sağlayıcı, bitiş geri sayım, oyun sayısı, link. Süresi geçmişi ele.

## Faz 3 — Canlı indirim feed'i (`/deals/v2`)
- ITAD `deals/v2?country=TR&sort=-cut&limit=&offset=` → `{nextOffset,hasMore,list:[{id,slug,title,assets:{boxart,banner...},deal:{price,cut,...}}]}`.
- `/api/deals` route (cache). Yeni "Canlı İndirimler" bölümü/sayfası — ITAD kapak + fiyat + % + mağaza + link. Katalogda olan oyun → kendi detayına, yoksa ITAD'a.

## Faz 4 — "En Çok Beklenenler" (`/waitlist/most/v1`)
- ITAD `waitlist/most/v1?limit=` → en çok beklenen oyunlar (assets dahil).
- `/api/anticipated` route. Ana sayfada "En Çok Beklenenler" bölümü; katalog eşleşmesi varsa detay linki.

## Sıra
1 → 2 → 3 → 4. Her faz: fetcher + route + UI + tsc/test/build + ekran doğrulama. Sonda commit+deploy.
Not: tüm veri gerçek (ITAD canlı). Sahte yok. [[no-fake-data-rule]]
