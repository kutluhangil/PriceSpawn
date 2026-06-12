import type { Metadata } from "next";
import { WatchContent } from "@/components/watch-content";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Takip Listem — ${SITE_NAME}`,
  description: "Takip ettiğin oyunlar ve hedef fiyatların.",
};

export default function WatchPage() {
  return <WatchContent />;
}
