import type { Metadata } from "next";
import { BrowseContent } from "@/components/browse-content";
import { STORES, type StoreId } from "@/lib/stores";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Tüm Oyunlar — ${SITE_NAME}`,
  description: "Tür, mağaza, abonelik ve fiyata göre filtrele; en ucuz oyunları bul.",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>;
}) {
  const { store } = await searchParams;
  const initialStore =
    store && store in STORES ? (store as StoreId) : undefined;
  return <BrowseContent initialStore={initialStore} />;
}
