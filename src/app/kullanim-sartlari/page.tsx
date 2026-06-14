import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { SITE_NAME, FEEDBACK_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Kullanım Şartları — ${SITE_NAME}`,
  description: "pricespawn kullanım şartları ve sorumluluk reddi.",
  alternates: { canonical: "/kullanim-sartlari" },
};

export default function KullanimSartlariPage() {
  return (
    <LegalPage title="Kullanım Şartları" updated="14 Haziran 2026">
      <p>
        pricespawn&apos;u kullanarak aşağıdaki şartları kabul etmiş olursun. Şartlar zaman zaman
        güncellenebilir; geçerli sürüm her zaman bu sayfadadır.
      </p>

      <h2>Hizmetin niteliği</h2>
      <p>
        pricespawn bir fiyat karşılaştırma ve bilgilendirme hizmetidir. Oyun satışı yapmaz, ödeme
        almaz; yalnızca mağazaların herkese açık fiyatlarını derler ve ilgili mağazalara yönlendirir.
      </p>

      <h2>Doğruluk ve sorumluluk reddi</h2>
      <ul>
        <li>
          Fiyatlar, indirimler ve uygunluk bilgileri değişebilir; gerçek zamanlı doğruluk garanti
          edilmez. Satın almadan önce nihai fiyatı mağazada teyit etmek senin sorumluluğundadır.
        </li>
        <li>
          Üçüncü taraf mağazalardaki alışveriş, teslimat veya iade süreçlerinden pricespawn sorumlu
          değildir.
        </li>
        <li>Hizmet &quot;olduğu gibi&quot; sunulur; kesintisizlik veya hatasızlık taahhüt edilmez.</li>
      </ul>

      <h2>Fikri mülkiyet</h2>
      <p>
        Oyun adları, kapak görselleri, mağaza ve marka logoları ilgili sahiplerine aittir ve
        yalnızca tanımlama amacıyla kullanılır. pricespawn bu markalarla resmi bir ortaklık iddia
        etmez.
      </p>

      <h2>İletişim</h2>
      <p>
        Sorular için: <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
