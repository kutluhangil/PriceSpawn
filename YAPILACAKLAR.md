# pricespawn — Senin Yapacakların (Manuel)

Bu dosya **senin elle yapman gereken** işleri listeler. Kod tarafı bitti; aşağıdakiler
sadece sende olan hesap/registrar/panel işleri.

Son güncelleme: 2026-06-24

---

## ✅ Şu an hazır olan (kod + altyapı)
- Site canlı: **https://pricespawn.vercel.app** (kısa URL bağlandı)
- Katalog **10.405 oyun** (8.646'sı gerçek TL fiyatlı) — **canlı/gerçek fiyatlar** (demo değil)
- Tüm özellikler canlı: arama, detay + fiyat geçmişi + ATL, Al/Bekle, ücretsiz oyunlar,
  abonelik değer, paketler, Explorer, Steam wishlist import (`/liste`), popülerlik
  liderlik tablosu (`/populer`), "tarihî dipte" filtresi, fiyat alarmı (push + e-posta),
  haftalık e-posta bülteni
- Prod env'ler **kurulu**: `ITAD_API_KEY`, `DATABASE_URL` (Neon), `CRON_SECRET`,
  `RESEND_API_KEY` + `EMAIL_FROM` (e-posta), `VAPID_*` (web push)
- Cron'lar aktif: günlük fiyat/abonelik yenileme, fiyat-düşüş bildirimi, **haftalık bülten (Pzt 09:00 UTC)**

---

## 🔴 1. Custom domain'i bağla (`hangisidahaucuz.com`) — opsiyonel ama önerilen

Site şu an `pricespawn.vercel.app`'te çalışıyor. Kendi domainini istiyorsan:

`hangisidahaucuz.com` Vercel projesine ekli ama **DNS doğrulaması bekliyor**.

1. Vercel → Project (pricespawn) → **Settings → Domains → `hangisidahaucuz.com`** aç.
2. Orada Vercel'in **sana gösterdiği tam DNS kayıtlarını** kopyala (A / CNAME ya da
   nameserver). Kayıtlar zaman zaman değişir → **panelde yazanı baz al**, eski
   değerlere güvenme.
3. Domaini aldığın yere (registrar: İsimtescil / GoDaddy / Namecheap vb.) gir,
   **DNS** ayarlarına o kayıtları ekle.
4. Kaydet → 10 dk–24 saat içinde yayılır, Vercel doğrulayınca otomatik HTTPS ile açılır.

> En temiz yol: registrar'da **nameserver**'ları `ns1.vercel-dns.com` / `ns2.vercel-dns.com`
> yap — tüm DNS'i Vercel yönetir, başka kayıt gerekmez.

Bağlanınca bana "domain bağlandı" de — `src/lib/site.ts`'teki site URL'ini ve
title'ı `hangisidahaucuz.com`'a çeviririm (şu an "pricespawn.com" yazıyor).

---

## 🟡 2. Resend gönderim domainini doğrula (e-postalar herkese gitsin)

`RESEND_API_KEY` + `EMAIL_FROM` prod'da **zaten ekli**. Ama Resend'de **gönderim
domaini doğrulanmamışsa**, e-postalar (fiyat alarmı + haftalık bülten) sadece kendi
adresine gider, başka abonelere **gitmez**.

Kontrol et: https://resend.com/domains
- `EMAIL_FROM`'daki domain (ör. `pricespawn.com`) listede **Verified** mı?
- Değilse: domaini ekle → Resend'in verdiği **DKIM/SPF TXT** kayıtlarını registrar'a koy → doğrulanmasını bekle.

> Not: `EMAIL_FROM` domaini ile site domaini farklı olabilir. Hangi domaini gönderici
> yaptığını sen biliyorsun; doğrulanması gereken o.

---

## 🟢 3. (İsteğe bağlı) Çalıştığını test et
- **Web push:** Chrome'da `/takip` → "🔔 Fiyat düşünce bildir" → izin ver → bir oyuna
  hedef fiyat koy. Cron sabah 07:00 UTC tetikler.
- **E-posta alarmı:** `/takip` → e-posta gir → gelen onay mailindeki linke tıkla.
- **Haftalık bülten:** `/takip`'te "Haftalık fırsat bülteni" kutusu açık (varsayılan).
  Pazartesi 09:00 UTC otomatik gider. Manuel tetiklemek için (mail GÖNDERİR):
  `curl -H "Authorization: Bearer <CRON_SECRET>" https://pricespawn.vercel.app/api/digest`

---

## Özet — şimdi ne yapmalısın?
1. **İstersen** `hangisidahaucuz.com` DNS'ini bağla (madde 1). Şart değil; kısa URL çalışıyor.
2. **Resend domainini doğrula** (madde 2) — e-postaların tüm abonelere ulaşması için tek gereken bu.
3. Gerisi hazır ve canlı.
