import { NextResponse } from "next/server";
import { sql, ensureSchema, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Toggle the weekly-digest preference by token (?on=0 opt out, ?on=1 opt in). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const token = u.searchParams.get("token");
  const on = u.searchParams.get("on") !== "0";
  if (token && hasDb()) {
    await ensureSchema();
    await sql!`UPDATE email_subs SET digest = ${on} WHERE token = ${token}`;
  }
  return NextResponse.redirect(new URL(`/takip?email=${on ? "digest-on" : "digest-off"}`, req.url));
}
