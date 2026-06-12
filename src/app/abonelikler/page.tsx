import type { Metadata } from "next";
import { SubsContent } from "@/components/subs-content";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Abonelik Değeri — ${SITE_NAME}`,
  description: "Game Pass, PS Plus, EA Play ve diğer aboneliklerin oyun değeri.",
};

export default function SubsPage() {
  return <SubsContent />;
}
