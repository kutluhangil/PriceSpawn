# pricespawn — Senin Yapacakların (Manuel)

Bu dosya, **senin elle yapman gereken** işleri listeler. Kod tarafı bitti; aşağıdakiler
sadece sende olan hesap/kayıt işleri.

Son güncelleme: 2026-06-12

---

## ✅ Şu an hazır olan
- Site canlıda: **https://hangisidahaucuzcom-kutluhans-projects-93876a9e.vercel.app**
- 120 oyun, tüm özellikler ve tasarım tamam.
- `hangisidahaucuz.com` domaini Vercel projesine **zaten bağlı** — sadece DNS ayarı eksik.

---

## 🔴 1. Domain'i yayına al (TEK acil iş)

İki seçeneğin var. Birini seç.

### Seçenek A — Elindeki `hangisidahaucuz.com`'u kullan (ücretsiz, hemen)
Bu domaini zaten almışsın. Sadece DNS'ini Vercel'e yönlendir.

Domaini aldığın yere (registrar paneline — GoDaddy / Namecheap / İsimtescil vb.) gir,
**DNS / Nameserver** ayarlarına git ve şu kayıtları ekle:

**En kolay yol — A kaydı:**
| Tip | İsim/Host | Değer |
|-----|-----------|-------|
| A | `@` | `216.198.79.1` |
| A | `@` | `64.29.17.1` |
| CNAME | `www` | `8cf27194390b279d.vercel-dns-017.com` |

(Panelde "iki A kaydı" desteklenmiyorsa tek `216.198.79.1` yeterli.)

**Alternatif — Nameserver değiştir** (tüm DNS'i Vercel yönetir):
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Kaydet → 10 dk–24 saat içinde yayılır. Vercel doğrulayınca site
`https://hangisidahaucuz.com` adresinde açılır (otomatik HTTPS).

### Seçenek B — `pricespawn.com` satın al (~$11.25/yıl)
Site adı "pricespawn" olduğu için marka bütünlüğü istersen:
1. Satın al: https://vercel.com/domains/search?q=pricespawn.com
2. Bana "aldım" de — projeye ben bağlarım (Vercel içinde alırsan DNS otomatik, ekstra
   ayar yok).

> Not: Site **adı** ("pricespawn") koddan bağımsız; hangi domaini kullanırsan kullan
> üstte "pricespawn" yazar. Yani A seçeneğiyle `hangisidahaucuz.com`'da da
> "pricespawn" markasıyla açılır. İstersen ikisini birden bağlayabiliriz.

---

## 🟡 2. (Opsiyonel, ileride) Canlı fiyat verisi

Şu an fiyatlar **demo** (gerçekçi ama sabit). Gerçek/güncel TL fiyatlara geçmek
istediğinde bu bir **geliştirme işi** — bana "canlı fiyatlara geç" dersin, yaparım.

Teknik yol haritası hazır: **`docs/LIVE_API_INTEGRATION.md`**
(Steam/Epic/GOG/Xbox API'leri, kur, günlük fiyat geçmişi, Vercel cron + cache).

Senin bu adım için elle yapman gereken (o zamana kadar gerekmez):
- Bir veritabanı bağlamak (Vercel'de tek tık: Storage → Neon Postgres ya da Supabase).

---

## 🟢 3. (İsteğe bağlı) İsim değişikliği
Site adını değiştirmek istersen tek dosya: `src/lib/site.ts`. Bana yeni adı söyle,
her yerde güncellerim.

---

## Özet — şimdi ne yapmalısın?
👉 **Sadece 1. maddeyi yap:** registrar'ında DNS kaydını ekle (Seçenek A, ücretsiz) ya
da pricespawn.com'u al (Seçenek B). Gerisi hazır.
