import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { SITE_NAME, FEEDBACK_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Hakkında — ${SITE_NAME}`,
  description:
    "pricespawn fiyatları nasıl topluyor? Kaynaklar, güncelleme sıklığı, tüm zamanların en düşük fiyatı ve bağımsızlık ilkemiz.",
  alternates: { canonical: "/hakkinda" },
};

export default function HakkindaPage() {
  return (
    <LegalPage title="Hakkında" updated="14 Haziran 2026">
      <p>
        <strong>pricespawn</strong>, Türkiye&apos;deki oyun mağazalarının fiyatlarını tek ekranda
        karşılaştıran bağımsız bir rehberdir. Amacımız: bir oyunun nerede gerçekten daha ucuz
        olduğunu, güncel TL kuruyla ve net biçimde göstermek.
      </p>

      <h2>Fiyatları nasıl topluyoruz?</h2>
      <p>
        Fiyatlar; Steam, Epic Games, GOG, Xbox Store, PlayStation Store, Ubisoft Store ve Humble
        Store gibi mağazaların <strong>herkese açık</strong> fiyat verilerinden derlenir. Tarihsel
        fiyat ve &quot;tüm zamanların en düşüğü&quot; (ATL) verisi için{" "}
        <a href="https://isthereanydeal.com" target="_blank" rel="noopener noreferrer">
          IsThereAnyDeal
        </a>{" "}
        kullanılır. Dolar bazlı fiyatlar, güncel USD→TRY kuru ile TL&apos;ye çevrilir.
      </p>
      <ul>
        <li>Fiyatlar düzenli aralıklarla otomatik yenilenir; her sayfada güncellenme durumu görünür.</li>
        <li>&quot;Tüm zamanların en düşüğü&quot; geçmiş verilere dayanır, anlık değişebilir.</li>
        <li>&quot;Al / Bekle&quot; değerlendirmesi, güncel fiyatın tarihsel en düşüğe uzaklığından üretilir.</li>
      </ul>

      <h2>Bağımsızlık ve affiliate</h2>
      <p>
        pricespawn hiçbir mağazaya bağlı değildir. Bazı mağazalara giden çıkış bağlantıları{" "}
        <strong>affiliate (ortaklık) bağlantısı</strong> olabilir; bir satın alma gerçekleşirse
        siteyi ayakta tutmaya yardımcı küçük bir komisyon alabiliriz.{" "}
        <strong>Bu, ödediğin fiyatı değiştirmez</strong> ve sıralamayı etkilemez — listeleme her
        zaman en ucuzdan pahalıya doğrudur.
      </p>

      <h2>Doğruluk</h2>
      <p>
        Fiyatlar bilgilendirme amaçlıdır ve mağaza tarafında değişebilir. Satın almadan önce nihai
        fiyatı ilgili mağazada teyit et. Marka adları ve logolar ilgili sahiplerine aittir.
      </p>

      <h2>İletişim</h2>
      <p>
        Hata bildirimi veya öneri için: <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
