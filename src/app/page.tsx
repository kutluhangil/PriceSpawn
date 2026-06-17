import { HomeContent } from "@/components/home-content";
import { catalogCount, catalogStoreCounts } from "@/lib/catalog";

export const revalidate = 3600;

export default async function Home() {
  const [catalogTotal, storeCounts] = await Promise.all([catalogCount(), catalogStoreCounts()]);
  return <HomeContent catalogTotal={catalogTotal} storeCounts={storeCounts} />;
}
