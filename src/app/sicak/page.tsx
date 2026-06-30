import type { Metadata } from "next";
import { HotDealsContent, type HotItem } from "@/components/hot-deals-content";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Sıcak Fırsatlar — ${SITE_NAME}`,
  description: "Topluluğun 🔥 oyuyla öne çıkardığı en sıcak oyun fırsatları.",
};

// Votes change slowly; refresh the ranking a few times an hour.
export const revalidate = 300;

async function topHeat(): Promise<HotItem[]> {
  if (!hasDb()) return [];
  await ensureSchema();
  const rows = (await sql!`
    SELECT v.slug, COUNT(*)::int AS n, c.title, c.cover
    FROM deal_votes v
    JOIN catalog c ON c.slug = v.slug
    GROUP BY v.slug, c.title, c.cover
    ORDER BY n DESC, v.slug ASC
    LIMIT 60`) as { slug: string; n: number; title: string; cover: string }[];
  return rows.map((r) => ({ slug: r.slug, title: r.title, cover: r.cover, count: r.n }));
}

export default async function HotDealsPage() {
  const items = await topHeat();
  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] py-10">
      <HotDealsContent items={items} />
    </div>
  );
}
