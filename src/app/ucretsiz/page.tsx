import type { Metadata } from "next";
import { FreeContent } from "@/components/free-content";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Ücretsiz Oyunlar — ${SITE_NAME}`,
  description: "Epic, PS Plus, Prime Gaming ve GOG'da şu an ücretsiz olan oyunlar.",
};

export default function FreePage() {
  return <FreeContent />;
}
