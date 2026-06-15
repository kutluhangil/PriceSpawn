import { NextResponse } from "next/server";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { itadSubs } from "@/lib/fetchers";
import { GAMES } from "@/data/games";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Rebuild real subscription membership from ITAD (games/subs). Maps each game's
 * ITAD id → our SubscriptionIds and rewrites the game_subs table. Run on a cron.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.ITAD_API_KEY;
  if (!hasDb() || !key) return NextResponse.json({ error: "no db or itad key" }, { status: 503 });

  await ensureSchema();

  // appid → slug, and the itad ids we'll query.
  const slugByAppid = new Map(GAMES.filter((g) => /^\d+$/.test(g.id)).map((g) => [g.id, g.slug]));
  const mapRows = (await sql!`SELECT appid, itad_id FROM itad_map WHERE itad_id <> ''`) as {
    appid: string;
    itad_id: string;
  }[];
  const slugByItad = new Map<string, string>();
  for (const r of mapRows) {
    const slug = slugByAppid.get(r.appid);
    if (slug) slugByItad.set(r.itad_id, slug);
  }
  const ids = [...slugByItad.keys()];

  // Query ITAD subs in batches; collect slug → sub ids.
  const bySlug = new Map<string, Set<string>>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const res = await itadSubs(batch, key);
    for (const [itadId, subIds] of Object.entries(res)) {
      const slug = slugByItad.get(itadId);
      if (!slug) continue;
      const set = bySlug.get(slug) ?? new Set<string>();
      for (const s of subIds) set.add(s);
      bySlug.set(slug, set);
    }
  }

  // Rewrite only the ITAD-owned services; PlayStation Plus is managed separately
  // (console-only, not tracked by ITAD) via /api/refresh-psplus.
  await sql!`DELETE FROM game_subs WHERE sub_id <> 'psplus'`;
  let rows = 0;
  const entries = [...bySlug.entries()];
  for (let i = 0; i < entries.length; i += 200) {
    const chunk = entries.slice(i, i + 200);
    const values = chunk.flatMap(([slug, set]) => [...set].map((sub) => ({ slug, sub })));
    for (const v of values) {
      await sql!`INSERT INTO game_subs (slug, sub_id) VALUES (${v.slug}, ${v.sub}) ON CONFLICT DO NOTHING`;
      rows++;
    }
  }

  // Per-service tally for visibility.
  const tally: Record<string, number> = {};
  for (const set of bySlug.values()) for (const s of set) tally[s] = (tally[s] ?? 0) + 1;

  return NextResponse.json({ ok: true, queried: ids.length, games: bySlug.size, rows, tally });
}
