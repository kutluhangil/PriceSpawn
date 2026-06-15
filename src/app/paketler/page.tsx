import type { Metadata } from "next";
import { BundlesContent } from "@/components/bundles-content";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Aktif Paketler — ${SITE_NAME}`,
  description: "Humble, Fanatical ve diğer mağazalarda şu an aktif oyun paketleri. Türkiye için canlı.",
  alternates: { canonical: "/paketler" },
};

export default function PaketlerPage() {
  return <BundlesContent />;
}
