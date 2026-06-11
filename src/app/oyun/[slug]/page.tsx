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
  return {
    title: `${game.title} fiyatları — ${SITE_NAME}`,
    description: `${game.title} hangi platformda daha ucuz? Steam, Epic, Xbox, PlayStation ve diğer mağazalardaki TL fiyatlarını karşılaştır.`,
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
  return <GameDetail game={game} />;
}
