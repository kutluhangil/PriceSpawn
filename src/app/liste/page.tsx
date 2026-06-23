import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { resolveSteamId, fetchWishlistAppids, wishlistDeals, summarize } from "@/lib/wishlist";
import { WishlistGrid } from "@/components/wishlist-grid";
import { WishlistImport, WishlistNotice } from "@/components/wishlist-import";
import { SectionHeading } from "@/components/section-heading";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Wishlist Fırsatları",
  robots: { index: false, follow: false },
};

function shell(children: ReactNode) {
  return <div className="mx-auto w-[min(100%-2rem,74rem)] py-10">{children}</div>;
}

export default async function ListePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; q?: string }>;
}) {
  const { id, q } = await searchParams;

  // Canonicalize a raw paste (?q=) into a shareable ?id=<steamid64>.
  if (!id && q) {
    const sid = await resolveSteamId(q);
    if (sid) redirect(`/liste?id=${sid}`);
    return shell(<WishlistNotice reason="not_found" />);
  }

  // No usable id → landing prompt (someone hit /liste directly).
  if (!id || !/^\d{17}$/.test(id)) {
    return shell(
      <div className="mx-auto max-w-xl py-16 text-center">
        <WishlistImport heading />
      </div>,
    );
  }

  const appids = await fetchWishlistAppids(id);
  if (!appids || appids.length === 0) return shell(<WishlistNotice reason="empty_or_private" />);

  const items = await wishlistDeals(appids);
  const summary = summarize(items, appids.length);
  return shell(
    <>
      <SectionHeading title="Steam Wishlist Fırsatların" />
      <WishlistGrid items={items} summary={summary} steamid={id} />
    </>,
  );
}
