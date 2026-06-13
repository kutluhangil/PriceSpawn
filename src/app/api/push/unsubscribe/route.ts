import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  let endpoint: string | undefined;
  try {
    endpoint = (await req.json()).endpoint;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!endpoint) return NextResponse.json({ error: "no endpoint" }, { status: 400 });
  await sql!`DELETE FROM push_watches WHERE endpoint = ${endpoint}`;
  await sql!`DELETE FROM push_subs WHERE endpoint = ${endpoint}`;
  return NextResponse.json({ ok: true });
}
