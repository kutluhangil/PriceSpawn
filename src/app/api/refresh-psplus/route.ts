import { NextResponse } from "next/server";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { GAMES } from "@/data/games";
import { normTitle } from "@/lib/normalize-title";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const NOISE = new Set([
  "PlayStation", "PC", "Xbox", "PlayStation 4", "PlayStation 5",
  "PlayStation Plus", "PS Plus Extra", "PS Plus Premium",
]);

/** Scrape the current PS Plus Extra catalog (titles) from GameScriptions. */
async function psPlusTitles(): Promise<string[]> {
  const res = await fetch("https://gamescriptions.com/subscription/service/ps_extra", {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/title="([^"]+)"/g)) {
    const t = m[1]
      .replace(/&amp;/g, "&")
      .replace(/&#39;|&rsquo;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();
    if (t.length < 2 || NOISE.has(t) || t.startsWith("Compare") || t.startsWith("Copy link")) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * Rebuild PlayStation Plus membership from the real catalog: match PS Plus
 * titles to our catalog by normalized title and rewrite the psplus rows.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  await ensureSchema();

  const titles = await psPlusTitles();
  if (titles.length === 0) {
    return NextResponse.json({ ok: false, reason: "no titles scraped" }, { status: 502 });
  }

  // Match by normalized title.
  const slugByNorm = new Map<string, string>();
  for (const g of GAMES) slugByNorm.set(normTitle(g.title), g.slug);
  const matched = new Set<string>();
  const missed: string[] = [];
  for (const t of titles) {
    const slug = slugByNorm.get(normTitle(t));
    if (slug) matched.add(slug);
    else missed.push(t);
  }

  await sql!`DELETE FROM game_subs WHERE sub_id = 'psplus'`;
  for (const slug of matched) {
    await sql!`INSERT INTO game_subs (slug, sub_id) VALUES (${slug}, 'psplus') ON CONFLICT DO NOTHING`;
  }

  return NextResponse.json({
    ok: true,
    scraped: titles.length,
    matched: matched.size,
    missedCount: missed.length,
    missedSample: missed.slice(0, 20),
  });
}
