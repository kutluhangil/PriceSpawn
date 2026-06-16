import type { Metadata } from "next";
import { ExplorerContent } from "@/components/explorer-content";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Explorer — Oyun Şirketleri | ${SITE_NAME}`,
  description:
    "Oyun dünyasının stüdyo ve yayıncılarını keşfet — kuruluş, kurucular, CEO, oyunlar ve platformlar. Valve, Rockstar, Nintendo, CD Projekt Red ve daha fazlası.",
  alternates: { canonical: "/explorer" },
};

export default function ExplorerPage() {
  return <ExplorerContent />;
}
