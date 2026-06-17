import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * On-demand purge for game detail pages. On-demand ISR pages (DB-only games)
 * otherwise cache their first render across deploys; this lets us refresh them
 * when the catalog changes (e.g. the free flag) or after a deploy.
 *
 * GET /api/revalidate-game?secret=...&slug=a,b,c   (comma-separated, or omit
 * `slug` to just authorize). Bearer auth also accepted.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const provided = url.searchParams.get("secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const slugs = (url.searchParams.get("slug") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const slug of slugs) revalidatePath(`/oyun/${slug}`);
  return NextResponse.json({ ok: true, revalidated: slugs.length, slugs });
}
