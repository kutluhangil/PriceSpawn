import type { Metadata } from "next";
import { SubsContent } from "@/components/subs-content";
import { SubChangeSummary } from "@/components/sub-change-summary";
import { recentChangeSummary } from "@/lib/sub-changes";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Abonelik Değeri — ${SITE_NAME}`,
  description: "Game Pass, PS Plus, EA Play ve diğer aboneliklerin oyun değeri.",
};

export const revalidate = 3600;

export default async function SubsPage() {
  const summary = await recentChangeSummary(30);
  return (
    <div className="mx-auto w-[min(100%-2rem,64rem)] pt-8">
      <SubChangeSummary summary={summary} />
      <SubsContent />
    </div>
  );
}
