# pricespawn — Senin Yapacakların (Manuel)

Bu dosya **senin elle yapman gereken** işleri listeler. Kod tarafı bitti; aşağıdakiler
sadece sende olan hesap/registrar/panel işleri.

Son güncelleme: 2026-07-02

---

## ✅ Şu an hazır olan (kod + altyapı)
- Site canlı: **https://pricespawn.vercel.app**
- Katalog **10.405 oyun** (8.646'sı gerçek TL fiyatlı) — **canlı/gerçek fiyatlar** (demo değil)
- Tüm özellikler canlı: arama, detay + fiyat geçmişi + ATL, Al/Bekle, ücretsiz oyunlar,
  abonelik değer, paketler, Explorer, Steam wishlist import (`/liste`), popülerlik
  liderlik tablosu (`/populer`), "tarihî dipte" filtresi, fiyat alarmı (push + e-posta),
  haftalık e-posta bülteni
- Prod env'ler **kurulu**: `ITAD_API_KEY`, `DATABASE_URL` (Neon), `CRON_SECRET`,
  `RESEND_API_KEY` + `EMAIL_FROM` (e-posta), `VAPID_*` (web push)
- Cron'lar aktif: günlük fiyat/abonelik yenileme, fiyat-düşüş bildirimi, **haftalık bülten (Pzt 09:00 UTC)**
- `hangisidahaucuz.com` Vercel'den kaldırıldı (vazgeçildi).

---

## 🔴 1. Custom domain bağla (`pricespawn.com`) — ileride

Site şu an `pricespawn.vercel.app`'te çalışıyor. `pricespawn.com` domain alınca:

1. Domaini satın al (Namecheap / GoDaddy / İsimtescil vb.).
2. Vercel → Project (pricespawn) → **Settings → Domains → `pricespawn.com`** ekle.
3. Vercel'in verdiği DNS kayıtlarını registrar'a gir.
   > En temiz yol: nameserver'ları `ns1.vercel-dns.com` / `ns2.vercel-dns.com` yap.
4. Bağlanınca bana haber ver — `src/lib/site.ts`'teki URL'i ve title'ı güncellerim.

---

## 🟡 2. Resend gönderim domainini doğrula (e-postalar herkese gitsin)

`RESEND_API_KEY` + `EMAIL_FROM` prod'da **zaten ekli**. Ama Resend'de **gönderim
domaini doğrulanmamışsa**, e-postalar (fiyat alarmı + haftalık bülten) sadece kendi
adresine gider, başka abonelere **gitmez**.

Kontrol et: https://resend.com/domains
- `EMAIL_FROM`'daki domain (ör. `pricespawn.com`) listede **Verified** mı?
- Değilse: domaini ekle → Resend'in verdiği **DKIM/SPF TXT** kayıtlarını registrar'a koy → doğrulanmasını bekle.

> Not: E-posta gönderici domain için ayrı bir subdomain kullanabilirsin (ör. `mail.pricespawn.com`).
> `pricespawn.com` alınınca bu da çözülür.

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
1. **`pricespawn.com` domain alınca** Vercel'e bağla (madde 1) ve bana haber ver.
2. **`pricespawn.com` alınınca** Resend'de gönderici domain doğrula (madde 2) — e-postalar tüm abonelere gitsin.
3. Gerisi hazır ve canlı.
