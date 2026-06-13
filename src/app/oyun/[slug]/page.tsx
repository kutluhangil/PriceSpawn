import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GAMES } from "@/data/games";
import { GameDetail } from "@/components/game-detail";
import { SITE_NAME } from "@/lib/site";

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
  if (!game) notFound();
  // Pass slug, not the game object: GameDetail re-reads the live-patched
  // catalog on the client so prices stay current (SSG prop would be frozen).
  return <GameDetail slug={slug} />;
}
