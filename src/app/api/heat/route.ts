import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import type { HeatCounts } from "@/lib/heat";

export const dynamic = "force-dynamic";

export interface HeatGetPayload {
  counts: HeatCounts;
  voted: Record<string, boolean>;
}

export interface HeatPostPayload {
  slug: string;
  count: number;
  voted: boolean;
}

const SLUG_RE = /^[a-z0-9-]{1,120}$/;

function ipHash(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  return ip ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : "";
}

/** Heat counts for the requested slugs, plus which ones this device has voted. */
export async function GET(req: Request): Promise<NextResponse<HeatGetPayload>> {
  const empty: HeatGetPayload = { counts: {}, voted: {} };
  if (!hasDb()) return NextResponse.json(empty);

  const url = new URL(req.url);
  const slugs = (url.searchParams.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SLUG_RE.test(s))
    .slice(0, 200);
  const device = url.searchParams.get("device") ?? "";
  if (slugs.length === 0) return NextResponse.json(empty);

  await ensureSchema();

  const countRows = (await sql!`
    SELECT slug, COUNT(*)::int AS n
    FROM deal_votes
    WHERE slug = ANY(${slugs})
    GROUP BY slug`) as { slug: string; n: number }[];

  const counts: HeatCounts = {};
  for (const r of countRows) counts[r.slug] = r.n;

  const voted: Record<string, boolean> = {};
  if (device) {
    const votedRows = (await sql!`
      SELECT slug FROM deal_votes
      WHERE device = ${device} AND slug = ANY(${slugs})`) as { slug: string }[];
    for (const r of votedRows) voted[r.slug] = true;
  }

  return NextResponse.json({ counts, voted });
}

/** Toggle this device's heat vote for a single game. */
export async function POST(req: Request): Promise<NextResponse<HeatPostPayload | { error: string }>> {
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });

  let body: { slug?: unknown; device?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const device = typeof body.device === "string" ? body.device.trim() : "";
  if (!SLUG_RE.test(slug)) return NextResponse.json({ error: "bad slug" }, { status: 400 });
  if (device.length < 8 || device.length > 64) {
    return NextResponse.json({ error: "bad device" }, { status: 400 });
  }

  await ensureSchema();

  const removed = (await sql!`
    DELETE FROM deal_votes WHERE slug = ${slug} AND device = ${device}
    RETURNING slug`) as { slug: string }[];

  let voted: boolean;
  if (removed.length > 0) {
    voted = false;
  } else {
    await sql!`
      INSERT INTO deal_votes (slug, device, ip_hash)
      VALUES (${slug}, ${device}, ${ipHash(req)})
      ON CONFLICT (slug, device) DO NOTHING`;
    voted = true;
  }

  const countRows = (await sql!`
    SELECT COUNT(*)::int AS n FROM deal_votes WHERE slug = ${slug}`) as { n: number }[];
  const count = countRows.length ? countRows[0].n : 0;

  return NextResponse.json({ slug, count, voted });
}
