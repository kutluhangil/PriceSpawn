import { HomeContent } from "@/components/home-content";
import { catalogCount } from "@/lib/catalog";

export const revalidate = 3600;

export default async function Home() {
  const catalogTotal = await catalogCount();
  return <HomeContent catalogTotal={catalogTotal} />;
}
