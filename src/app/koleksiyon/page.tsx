import type { Metadata } from "next";
import { CollectionContent } from "@/components/collection-content";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Koleksiyonum — ${SITE_NAME}`,
  description: "Sahip olduğun oyunlar ve indirime girenler.",
};

export default function CollectionPage() {
  return <CollectionContent />;
}
