import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { SITE_NAME, FEEDBACK_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Gizlilik & KVKK — ${SITE_NAME}`,
  description:
    "pricespawn gizlilik politikası ve KVKK aydınlatma metni: hangi veriyi topluyoruz, nasıl kullanıyoruz, haklarınız.",
  alternates: { canonical: "/gizlilik" },
};

export default function GizlilikPage() {
  return (
    <LegalPage title="Gizlilik & KVKK" updated="14 Haziran 2026">
      <p>
        Bu metin, pricespawn (&quot;biz&quot;) tarafından işlenen kişisel verilere ilişkin
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında aydınlatma
        amacı taşır. Gizliliğine önem veriyoruz ve mümkün olan en az veriyle çalışırız.
      </p>

      <h2>Hangi veriyi topluyoruz?</h2>
      <ul>
        <li>
          <strong>Cihazında saklanan tercihler:</strong> tema, dil ve izleme listen tarayıcının
          yerel deposunda (localStorage) tutulur — sunucularımıza gönderilmez.
        </li>
        <li>
          <strong>Ölçümleme:</strong> sayfa görüntüleme ve performans verileri için Vercel
          Analytics &amp; Speed Insights kullanılır. Bu veriler topludur ve seni kişisel olarak
          tanımlamaz.
        </li>
        <li>
          <strong>Push bildirimi (isteğe bağlı):</strong> yalnızca izin verirsen, fiyat düşüşü
          bildirimi gönderebilmek için tarayıcının push abonelik bilgisi saklanır. İzni istediğin
          an geri çekebilirsin.
        </li>
      </ul>

      <h2>Çerezler</h2>
      <p>
        Temel işlevler ve ölçümleme için çerez/benzeri teknolojiler kullanırız. İlk ziyaretinde
        çıkan bandı üzerinden tercihini belirleyebilirsin.
      </p>

      <h2>Üçüncü taraflar</h2>
      <p>
        Site Vercel altyapısında barındırılır. Mağazalara verilen çıkış bağlantıları seni ilgili
        üçüncü taraf sitelere yönlendirir; orada kendi gizlilik politikaları geçerlidir.
      </p>

      <h2>KVKK kapsamındaki haklarınız</h2>
      <p>
        Kişisel verilerine erişme, düzeltme, silinmesini isteme ve işlemeye itiraz etme hakların
        bulunur. Taleplerin için <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>{" "}
        adresinden bize ulaşabilirsin.
      </p>
    </LegalPage>
  );
}
