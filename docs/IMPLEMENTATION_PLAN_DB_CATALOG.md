# Uygulama Planı — DB-tabanlı sınırsız katalog (2026-06-16)

Hedef: 10 yıllık (binlerce) oyun aranabilir + detay sayfası açılabilir, client bundle şişmeden.

**Strateji (düşük risk):** `src/data/games.ts GAMES` (~2739) ana sayfa/listeleme/section'lar için KALIR (client bundle sabit). **Arama + detay DB `catalog` tablosundan** (GAMES seed + binlerce import) — sınırsız, client'a bundle edilmez.

## P1 — DB catalog + sunucu arama
- db.ts: `catalog(slug PK, appid, title, norm, cover, genres jsonb, score, year, subs jsonb, unreleased)` + norm index.
- `/api/catalog-sync` (cron+manuel): GAMES'i catalog'a upsert (seed). İleride import de buraya yazar.
- `/api/search?q=`: catalog'ta `norm LIKE` ile ara, startsWith>word>includes sırala, cheapest TRY (game_prices join + fx). `SearchResult{slug,title,cover,year,priceTRY}`.
- search-bar + command-palette: client `searchGames(GAMES)` yerine debounced `/api/search` fetch. SearchResult render.

## P2 — Detay sayfası DB + ISR
- `oyun/[slug]/page.tsx`: `generateStaticParams` popüler altküme (GAMES). `dynamicParams=true` → bilinmeyen slug ISR. GameDetail: GAMES'te yoksa DB catalog'tan oku.
- DB-only oyun fiyatları: `/api/game-price?slug=` (game_prices'tan, fx) veya /api/prices kapsa.

## P3 — Toplu import (10 yıl)
- SteamSpy `request=all` (sayfalı, owners) → 2016+ filtre + sahiplik eşiği → top binlerce. + isimle franchise (NBA 2K, EA FC, Madden, COD, F1, WWE…) Steam search.
- Steam appdetails enrich (TR tür/yıl/metacritic/cover) → catalog tablosuna yaz (games.ts'e DEĞİL → bundle şişmez).
- refresh route catalog appid'lerini de fiyatlasın (game_prices).

## Sıra
P1 → P2 → P3. Her adım tsc/test/build + doğrulama. Tüm veri gerçek (Steam/ITAD/SteamSpy). [[no-fake-data-rule]]
