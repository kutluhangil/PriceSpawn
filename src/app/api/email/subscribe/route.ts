import { NextResponse } from "next/server";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { sendEmail, emailConfigured, verifyEmailHtml } from "@/lib/email";

export const dynamic = "force-dynamic";

interface Body {
  email: string;
  watches: { slug: string; targetTRY: number | null }[];
  /** Background re-sync from the client — don't re-send the verification email. */
  silent?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "bad email" }, { status: 400 });
  }
  await ensureSchema();

  // Keep the existing token + verified flag; create a sub on first sight.
  const existing = (await sql!`SELECT token, verified FROM email_subs WHERE email = ${email}`) as {
    token: string;
    verified: boolean;
  }[];
  let token = existing[0]?.token;
  const verified = existing[0]?.verified ?? false;
  if (!token) {
    token = crypto.randomUUID();
    await sql!`INSERT INTO email_subs (email, token, verified) VALUES (${email}, ${token}, false)`;
  }

  const watches = Array.isArray(body.watches) ? body.watches : [];
  const slugs = watches.map((w) => w.slug);
  if (slugs.length) {
    await sql!`DELETE FROM email_watches WHERE email = ${email} AND slug <> ALL(${slugs})`;
  } else {
    await sql!`DELETE FROM email_watches WHERE email = ${email}`;
  }
  for (const w of watches) {
    await sql!`
      INSERT INTO email_watches (email, slug, target_try)
      VALUES (${email}, ${w.slug}, ${w.targetTRY})
      ON CONFLICT (email, slug) DO UPDATE SET target_try = ${w.targetTRY}`;
  }

  // Double opt-in: e-mail a verification link the first time around.
  let mailed = false;
  if (!verified && !body.silent && emailConfigured()) {
    const origin = new URL(req.url).origin;
    mailed = await sendEmail(
      email,
      "pricespawn — e-posta bildirimlerini onayla",
      verifyEmailHtml(`${origin}/api/email/verify?token=${token}`),
    );
  }
  return NextResponse.json({ ok: true, verified, mailed, watches: watches.length });
}
