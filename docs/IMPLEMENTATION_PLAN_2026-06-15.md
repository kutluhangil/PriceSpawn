# Uygulama Planı — Gerçek Veri + Eksikler (2026-06-15)

**Kural:** Sitedeki tüm veri GERÇEK. Sahte/demo yok. Olanı kaldır.

Ajanlı keşif tamamlandı (4 ajan). Bulgular `checkpoint.md` + aşağıda.

## Faz 1 — Satın alma linkleri (her oyun) ✅ TAMAM
- Kök neden: ITAD `url` çoğu satırda boş → `store-url.ts` null → `<span>` tıklanamaz.
- Fix: `src/lib/store-url.ts` her mağaza için deterministik fallback (Steam appid ürün sayfası, diğerleri mağaza-içi arama). `storeUrl()` artık asla null değil → her satır tıklanabilir.

## Faz 2 — Ücretsiz oyun görselleri ✅ TAMAM
- Kök neden: `src/data/luna.ts` 15 oyunun hepsi `coverUrl:""` → gradient.
- Fix: her oyunun Steam appid'i çözüldü (storesearch), `cover(appid)` ile gerçek Steam kapağı bakıldı. steamstatic host zaten izinli.

## Faz 3 — Gerçek abonelik üyeliği (sayılar gerçek olsun)
- Kaynak: **ITAD `/games/subs/v1?country=TR`** (oyun başına hangi servislerde olduğunu döner) + mevcut `itad_map` (appid→itad_id).
- Plan: DB tablo `game_subs(slug, sub_id)`; `/api/refresh-subs` cron — itad_id'li oyunları batch'le ITAD subs sorgula, servis adı → bizim id (gamepass/psplus/eaplay/ubisoftplus/luna) eşle, yaz. `/api/prices` (veya yeni `/api/subs`) döndürür, `live.ts applyLive` `game.subscriptions`'ı canlı veriyle set eder.
- Sonuç: psplus 12 → yüzlerce (gerçek). Küratörlü etiketler gerçek ITAD verisiyle değişir.
- Not: ITAD subs servis-düzeyi (tier değil). Tier bilgisi Faz 4 metadata.

## Faz 4 — Abonelik planları/kademeleri (UI)
- `SubscriptionMeta`'ya `plans?: {name, monthlyTRY, note, officialCount}[]` ekle (Game Pass: Essential/Premium/Ultimate/PC; PS Plus: Essential/Extra/Deluxe; EA Play/Pro; Ubisoft+ Premium/Classics).
- `sub-value-card.tsx`'e planlar şeridi ekle (fiyat + resmi "X+ oyun"). TR fiyatları resmi store'dan (volatil, kaynak belirt).
- Senkron dosyalar: `subscriptions.ts` (tip + map), `store-logo.tsx` SUB_BRAND. (Bulgu: tier'ı ayrı id yapmak yerine `plans` alanı daha temiz — değer hesabı servis-düzeyi kalır.)

## Faz 5 — Kütüphane genişletme + Game Pass kataloğu
- Game Pass: `catalog.gamepass.com/sigls/v2?id=<GUID>` (Console f6f1f99f-..., PC fdd9e2a7-..., EA b8900d09-...) → `displaycatalog.mp.microsoft.com/v7.0/products?bigIds=` → başlık. ITAD lookup ile Steam appid eşle → games.ts'e ekle + gamepass etiketle.
- PS Plus: resmi A-Z HTML (playstation.com/.../ps-plus/games) veya platprices.com scrape (~422 Extra/~164 Premium).
- EA Play: Game Pass EA sigls (~100). Ubisoft+: gg.deals/PCGamingWiki api.php (UA gerekir). Luna: küratörlü.
- gen2.py mantığı genişletilir; ITAD ile gerçekle.

## Faz 6 — Demo/sahte veri denetimi
- sales.ts projeksiyon tarihleri, kalan küratörlü veriler gözden geçir; gerçeğe çek veya kaldır.

## Sıra
1✅ 2✅ → 3 (en yüksek değer: gerçek sayılar) → 4 → 5 → 6. Her faz: tsc + test + ekran doğrulama.
