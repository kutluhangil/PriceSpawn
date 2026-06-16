import type { Metadata } from "next";
import { GAMES } from "@/data/games";
import { GameDetail } from "@/components/game-detail";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Pre-render the bundled catalog; DB-only (bulk-imported) games render on demand.
export const dynamicParams = true;

export function generateStaticParams() {
  return GAMES.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) return {};
  const title = `${game.title} fiyatları — ${SITE_NAME}`;
  const description = `${game.title} hangi platformda daha ucuz? Steam, Epic, Xbox, PlayStation ve diğer mağazalardaki TL fiyatlarını karşılaştır.`;
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
  const game = GAMES.find((g) => g.slug === slug);
  // DB-only game: render the shell; GameDetail fetches it (and 404s if missing).
  if (!game) return <GameDetail slug={slug} />;

  const url = `${SITE_URL}/oyun/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        "@id": `${url}#game`,
        name: game.title,
        url,
        ...(game.coverUrl ? { image: game.coverUrl } : {}),
        genre: game.genres,
        ...(game.releaseYear ? { datePublished: String(game.releaseYear) } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Oyunlar", item: `${SITE_URL}/oyunlar` },
          { "@type": "ListItem", position: 3, name: game.title, item: url },
        ],
      },
    ],
  };

  // Pass slug, not the game object: GameDetail re-reads the live-patched
  // catalog on the client so prices stay current (SSG prop would be frozen).
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <GameDetail slug={slug} />
    </>
  );
}
