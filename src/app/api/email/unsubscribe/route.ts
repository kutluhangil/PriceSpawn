import { NextResponse } from "next/server";
import { sql, ensureSchema, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token && hasDb()) {
    await ensureSchema();
    const rows = (await sql!`SELECT email FROM email_subs WHERE token = ${token}`) as { email: string }[];
    if (rows[0]) {
      await sql!`DELETE FROM email_watches WHERE email = ${rows[0].email}`;
      await sql!`DELETE FROM email_subs WHERE token = ${token}`;
    }
  }
  return NextResponse.redirect(new URL("/takip?email=unsubscribed", req.url));
}
