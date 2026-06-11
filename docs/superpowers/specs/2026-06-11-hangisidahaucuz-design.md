# hangisidahaucuz.com — Tasarım Spec'i

**Tarih:** 2026-06-11
**Durum:** Onaylandı (kullanıcı, sohbet içinde)

## Amaç

Türkiye kullanıcıları için oyun fiyatı karşılaştırma sitesi. Kullanıcı bir oyun arar;
site o oyunun Türkiye'de aktif tüm dijital mağazalardaki fiyatını TL olarak gösterir
ve hangisinin en ucuz olduğunu vurgular. Abonelik servislerinde (Game Pass vb.)
dahilse onu da gösterir. Hesap/giriş yok — sadece bakılır.

## Kararlar (kullanıcı onaylı)

| Karar | Seçim |
|---|---|
| Veri kaynağı | Önce demo veri (gerçekçi örnek fiyatlar); canlı API katmanı ileride |
| Stack | Next.js (App Router) + TypeScript + Tailwind CSS, Vercel deploy |
| Kapsam | Minimal: ana sayfa + anlık arama + oyun detay sayfası |
| Tasarım yönü | Glass (glassmorphism) — dark/light iki ayrı görsel kimlik |
| Dil | TR varsayılan + EN toggle |

## Mimari

- **Next.js App Router**, TypeScript, Tailwind CSS. Vercel'e deploy, domain: hangisidahaucuz.com.
- **Demo veri:** `src/data/games.ts` — ~50 popüler oyun. Alanlar: `id`, `slug`, `title`,
  `coverUrl`, `genres`, `score`, `releaseYear`, `prices[]`, `subscriptions[]`.
- **Fiyat modeli:** `prices[]` elemanı: `{ store, amount, currency, discountPercent?, url? }`.
  Steam fiyatları `USD` tutulur; gösterimde demo kurla TL'ye çevrilir
  (`₺1.234` büyük, altında `$29.99 · güncel kurla` küçük). Diğer mağazalar TL.
- **Kur:** `src/lib/exchange.ts` — demo `USD_TRY` sabiti + `toTRY()` fonksiyonu.
  İleride canlı kur API'sine geçiş bu tek dosyada yapılır.
- **Arama:** Client-side fuzzy. Türkçe karakter normalizasyonu (ı/İ, ş, ç, ğ, ö, ü)
  iki yönlü — "forza", "FORZA", "witcher"/"wıtcher" hepsi eşleşir.

## Mağazalar ve abonelikler

**Mağazalar (TR'de aktif):** Steam, Epic Games, GOG, Xbox Store, PlayStation Store,
Ubisoft Store, EA App, Humble Store.

**Abonelikler:** Xbox Game Pass, PS Plus Extra, EA Play, Ubisoft+, Amazon Luna.
Oyun abonelikte dahilse detayda ayrı blok: "Game Pass'e dahil — ₺379/ay" gibi,
aylık abonelik fiyatıyla birlikte. Kartlarda küçük rozet.

Oyun bir mağazada yoksa o satır hiç gösterilmez. Hiçbir abonelikte yoksa abonelik
bloğu görünmez.

## Sayfalar

### Ana sayfa (`/`)
- Hero: site adı + slogan + **büyük arama çubuğu**. Çubuğun kenarında Apple
  Intelligence tarzı dönen gökkuşağı glow animasyonu (conic-gradient).
- Anlık arama dropdown'u: yazarken sonuçlar düşer — küçük kapak, en ucuz mağaza
  logosu + TL fiyat, abonelik rozetleri. Tıklayınca detaya gider.
- "Günün Fırsatları" şeridi: en yüksek indirimli oyunlar.
- Popüler oyunlar grid'i: kapak, en ucuz fiyat + mağaza, indirim rozeti, abonelik rozetleri.

### Oyun detay (`/oyun/[slug]`)
- Büyük kapak header (blur arka plan + cam panel).
- Tüm mağaza fiyatları ucuzdan pahalıya sıralı; en ucuz satırda "EN UCUZ" vurgusu.
- İndirim yüzdesi ve üstü çizili eski fiyat (indirimliyse).
- Steam satırında USD→TL çeviri notu.
- Abonelik bloğu ayrı: dahil olduğu servisler + aylık fiyatları.
- Bilinmeyen slug → Next.js `notFound()` → özel 404.

## Tema — iki ayrı kimlik (Glass)

- **Dark:** koyu zemin, hareketli neon gradient mesh (mor/cyan/pembe), buzlu cam
  kartlar (`backdrop-blur` + şeffaflık), neon vurgular.
- **Light:** pastel gradient mesh (şeftali/lila/gök mavisi), açık buzlu cam,
  yumuşak gölgeler. Palet ve atmosfer dark'tan belirgin farklı.
- Uygulama: `data-theme` attribute + CSS custom properties. Varsayılan sistem
  tercihi; toggle ile değişir; localStorage'da kalıcı. FOUC önleme: inline script.

## Dil (i18n)

- TR varsayılan, EN toggle navbar'da. Hafif sözlük: `src/i18n/tr.ts`, `src/i18n/en.ts`.
- React context + localStorage. URL prefix yok. Oyun adları çevrilmez.
- Fiyat formatı: TR'de `₺1.234,50`, EN'de `₺1,234.50` (`Intl.NumberFormat`).

## Hata durumları

- Arama sonucu yoksa: "Sonuç bulunamadı" boş durumu (iki dilde).
- Kapak görseli yüklenmezse: gradient placeholder.
- Geçersiz slug: 404.

## Test

- Birim: `toTRY()` kur çevirisi, arama normalizasyonu (Türkçe karakterler),
  en ucuz fiyat seçimi (abonelik hariç tutulur — abonelik "sahiplik" değil).
- Veri tutarlılığı: slug'lar benzersiz, tüm fiyatlar > 0, her oyunda ≥1 mağaza.

## Kapsam dışı (ileride)

- Canlı fiyat çekme (Steam/Epic/GOG/Xbox API fetcher'ları + cron + cache)
- Canlı USD/TRY kuru
- Fiyat geçmişi grafikleri, fırsat listesi sayfası, platform sayfaları
- İsim değişikliği ihtimali var — site adı tek yerden (config) gelir
