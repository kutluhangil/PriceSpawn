import type { Metadata } from "next";
import { PopularBoard } from "@/components/popular-board";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Popüler Oyunlar — ${SITE_NAME}`,
  description: "Oyuncuların en çok takibe aldığı ve en popüler oyunların canlı sıralaması (IsThereAnyDeal).",
};

export default function PopularPage() {
  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] py-10">
      <PopularBoard />
    </div>
  );
}
