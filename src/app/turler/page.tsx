import type { Metadata } from "next";
import { GenreHubContent } from "@/components/genre-hub-content";
import { genreHub, type GenreHubItem } from "@/lib/genres";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Türler — ${SITE_NAME}`,
  description: "Oyun türlerine göz at: aksiyon, RPG, strateji ve daha fazlası. Her türü tüm mağazalarda TL fiyatıyla karşılaştır.",
};

// Genre distribution barely moves; rebuild daily.
export const revalidate = 86400;

async function genres(): Promise<GenreHubItem[]> {
  if (!hasDb()) return [];
  await ensureSchema();
  const rows = (await sql!`
    SELECT genre, COUNT(*)::int AS count
    FROM catalog, jsonb_array_elements_text(genres) AS genre
    WHERE unreleased = false
    GROUP BY genre
    ORDER BY count DESC`) as { genre: string; count: number }[];
  return genreHub(rows, 20).slice(0, 60);
}

export default async function GenresPage() {
  const items = await genres();
  return <GenreHubContent items={items} />;
}
