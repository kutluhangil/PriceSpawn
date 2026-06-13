import { NextResponse } from "next/server";
import { sql, ensureSchema, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Body {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  watches: { slug: string; targetTRY: number | null }[];
}

export async function POST(req: Request) {
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }
  await ensureSchema();

  await sql!`
    INSERT INTO push_subs (endpoint, p256dh, auth, updated_at)
    VALUES (${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth}, now())
    ON CONFLICT (endpoint) DO UPDATE
      SET p256dh = ${sub.keys.p256dh}, auth = ${sub.keys.auth}, updated_at = now()`;

  const watches = Array.isArray(body.watches) ? body.watches : [];
  const slugs = watches.map((w) => w.slug);
  // Remove watches no longer in the list (preserve last_notified_day for kept ones).
  if (slugs.length) {
    await sql!`DELETE FROM push_watches WHERE endpoint = ${sub.endpoint} AND slug <> ALL(${slugs})`;
  } else {
    await sql!`DELETE FROM push_watches WHERE endpoint = ${sub.endpoint}`;
  }
  for (const w of watches) {
    await sql!`
      INSERT INTO push_watches (endpoint, slug, target_try)
      VALUES (${sub.endpoint}, ${w.slug}, ${w.targetTRY})
      ON CONFLICT (endpoint, slug) DO UPDATE SET target_try = ${w.targetTRY}`;
  }
  return NextResponse.json({ ok: true, watches: watches.length });
}
