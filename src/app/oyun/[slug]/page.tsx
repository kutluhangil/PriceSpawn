import type { Metadata } from "next";
import { GAMES } from "@/data/games";
import { catalogMetaBySlug } from "@/lib/catalog";
import { GameDetail } from "@/components/game-detail";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Pre-render the bundled catalog; DB-only (bulk-imported) games render on demand.
export const dynamicParams = true;
// On-demand pages must refresh so they pick up new deploys (chunks) + catalog
// changes (e.g. the free flag); without this they'd cache the first render
// forever. Manual purge: /api/revalidate-game.
export const revalidate = 3600;

export function generateStaticParams() {
  return GAMES.map((game) => ({ slug: game.slug }));
}

/** Title/cover/genres/year from GAMES or, for DB-only games, the catalog table. */
async function gameMeta(slug: string) {
  const g = GAMES.find((x) => x.slug === slug);
  if (g) return { title: g.title, cover: g.coverUrl, genres: g.genres, year: g.releaseYear };
  return catalogMetaBySlug(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = await gameMeta(slug);
  if (!m) return {};
  const title = `${m.title} fiyatları — ${SITE_NAME}`;
  const description = `${m.title} hangi platformda daha ucuz? Steam, Epic, Xbox, PlayStation ve diğer mağazalardaki TL fiyatlarını karşılaştır.`;
  return {
    title,
    description,
    alternates: { canonical: `/oyun/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/oyun/${slug}`,
      images: [`/oyun/${slug}/opengraph-image`],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = await gameMeta(slug);

  const url = `${SITE_URL}/oyun/${slug}`;
  const jsonLd = m
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "VideoGame",
            "@id": `${url}#game`,
            name: m.title,
            url,
            ...(m.cover ? { image: m.cover } : {}),
            genre: m.genres,
            ...(m.year > 0 ? { datePublished: String(m.year) } : {}),
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Oyunlar", item: `${SITE_URL}/oyunlar` },
              { "@type": "ListItem", position: 3, name: m.title, item: url },
            ],
          },
        ],
      }
    : null;

  // GameDetail reads the live-patched GAMES on the client, or fetches DB-only games.
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <GameDetail slug={slug} />
    </>
  );
}
