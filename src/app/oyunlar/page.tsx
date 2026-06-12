import type { Metadata } from "next";
import { BrowseContent } from "@/components/browse-content";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Tüm Oyunlar — ${SITE_NAME}`,
  description: "Tür, mağaza, abonelik ve fiyata göre filtrele; en ucuz oyunları bul.",
};

export default function BrowsePage() {
  return <BrowseContent />;
}
