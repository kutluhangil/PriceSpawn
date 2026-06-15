# Uygulama Planı — Codex sonrası + mobil-first + abonelik/takvim/buy-links (2026-06-15b)

## A. Codex araması/filtre + buy-links doğrulama
- Codex `b22d749`: Enter → `/oyunlar?q=`, mobil `onPointerDown` öneri seçimi, q-filtre, büyük dokunma hedefleri. tsc/test/build ile teyit.
- Buy links: `store-url.ts` her zaman URL döndürüyor (canlı deal → else mağaza ürün/arama). Her oyun detayında tıklanabilir. Bir oyunda doğrula.

## B. EA Play + EA Play Pro → tek kart (tier'lı, Game Pass gibi)
- `subscriptions.ts`: eaplay'e `plans` ekle (EA Play ₺219.99 + EA Play Pro ₺619).
- `sub-value.ts`: `subscriptionValueMerged(ids[], games)` — slug union, değer = union toplamı.
- `subs-content.tsx`: EA'yı tek kart (eaplay + eaplaypro union), eaplaypro ayrı kartı kaldır.
- `sub-value-card.tsx`: opsiyonel `mergeIds` → union say/değer/önizleme.
- eaplay/eaplaypro SubscriptionId KALIR (etiket/rozet bozulmaz).

## C. İndirim Takvimi premium redesign + companion widget
- `sale-calendar.tsx`: aya göre gruplu, premium "takvim" hissi — ay başlıkları, her etkinlik bir zaman-ekseni bandı (yaklaşan/aktif görsel), bugün işareti, geri sayım. Mobil-first stack.
- Companion (site'a uygun, benim seçimim): **"Sıradaki Büyük İndirim" geri sayım kartı** — bir sonraki büyük indirime kalan gün/saat, mağaza markası, tarih aralığı, aktifse "Şu an aktif". `next-sale-countdown.tsx`.
- `home-content.tsx`: takvim bölümü 2-kolon (lg): sol companion, sağ takvim; mobil stack.

## D. Mobil-first kusursuz dokunmatik pass
- Tüm interaktif öğeler ≥44px dokunma hedefi (globals helper).
- bottom-nav yüksekliği/safe-area, aktif durum.
- subs kapak grid mobilde 4 → değil, daha büyük; calendar/billboard/detail mobil.
- game detail fiyat satırları (StoreLink) mobilde net tıklanır.
- navbar mobil; yatay scroll rayları momentum.

## E. Buy links — her oyun
- store-url.ts mevcut; her detayda doğrula. Gerekirse fiyat satırını daha belirgin "↗ mağazada aç" yap.

## Sıra
A(doğrula) → B → C → D → E. Her adım tsc+build+mobil ekran doğrulama. Commit+deploy sonda.
