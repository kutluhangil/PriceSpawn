import { NextResponse } from "next/server";
import { sql, ensureSchema, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token && hasDb()) {
    await ensureSchema();
    await sql!`UPDATE email_subs SET verified = true WHERE token = ${token}`;
  }
  return NextResponse.redirect(new URL("/takip?email=verified", req.url));
}
