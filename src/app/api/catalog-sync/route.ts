import { NextResponse } from "next/server";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { GAMES } from "@/data/games";
import { normalizeTR } from "@/lib/search";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Seed/refresh the `catalog` table from the bundled GAMES (idempotent upsert). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  await ensureSchema();

  const rows = GAMES.map((g) => ({
    slug: g.slug,
    appid: /^\d+$/.test(g.id) ? g.id : "",
    title: g.title,
    norm: normalizeTR(g.title),
    cover: g.coverUrl,
    genres: JSON.stringify(g.genres),
    score: g.score,
    year: g.releaseYear,
    unreleased: !!g.unreleased,
  }));

  let n = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    await Promise.all(
      chunk.map(
        (r) => sql!`
          INSERT INTO catalog (slug, appid, title, norm, cover, genres, score, year, unreleased, updated_at)
          VALUES (${r.slug}, ${r.appid}, ${r.title}, ${r.norm}, ${r.cover}, ${r.genres}::jsonb, ${r.score}, ${r.year}, ${r.unreleased}, now())
          ON CONFLICT (slug) DO UPDATE SET
            appid = EXCLUDED.appid, title = EXCLUDED.title, norm = EXCLUDED.norm,
            cover = EXCLUDED.cover, genres = EXCLUDED.genres, score = EXCLUDED.score,
            year = EXCLUDED.year, unreleased = EXCLUDED.unreleased, updated_at = now()`,
      ),
    );
    n += chunk.length;
  }

  const total = (await sql!`SELECT COUNT(*)::int AS c FROM catalog`) as { c: number }[];
  return NextResponse.json({ ok: true, seeded: n, catalogTotal: total[0]?.c ?? 0 });
}
