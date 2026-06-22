import type { Metadata } from "next";
import { Suspense } from "react";
import { SubChangesContent } from "@/components/sub-changes-content";
import { recentChanges } from "@/lib/sub-changes";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Abonelik Değişiklikleri — ${SITE_NAME}`,
  description: "Game Pass, PS Plus, EA Play ve Ubisoft+ kataloglarına eklenen ve kaldırılan oyunlar.",
};

export const revalidate = 3600;

export default async function SubChangesPage() {
  const changes = await recentChanges(500);
  return (
    <Suspense>
      <SubChangesContent changes={changes} />
    </Suspense>
  );
}
