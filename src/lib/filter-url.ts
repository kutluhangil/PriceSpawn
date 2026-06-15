import type { FilterOpts, SortKey } from "@/lib/filters";
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";

const SORTS: SortKey[] = ["discount", "priceAsc", "priceDesc", "score", "year", "name"];

export function serializeOpts(o: FilterOpts): string {
  const p = new URLSearchParams();
  const q = o.query.trim();
  if (q) p.set("q", q);
  if (o.genres.length) p.set("g", o.genres.join(","));
  if (o.stores.length) p.set("s", o.stores.join(","));
  if (o.subscriptions.length) p.set("sub", o.subscriptions.join(","));
  if (o.onlyDiscounted) p.set("disc", "1");
  if (o.minTRY !== null) p.set("min", String(o.minTRY));
  if (o.maxTRY !== null) p.set("max", String(o.maxTRY));
  if (o.sort !== "discount") p.set("sort", o.sort);
  return p.toString();
}

export function parseOpts(params: URLSearchParams): Partial<FilterOpts> {
  const out: Partial<FilterOpts> = {};
  const q = params.get("q")?.trim();
  if (q) out.query = q;
  const g = params.get("g");
  if (g) out.genres = g.split(",").filter(Boolean);
  const s = params.get("s") ?? params.get("store");
  if (s) out.stores = s.split(",").filter(Boolean) as StoreId[];
  const sub = params.get("sub");
  if (sub) out.subscriptions = sub.split(",").filter(Boolean) as SubscriptionId[];
  if (params.get("disc") === "1") out.onlyDiscounted = true;
  const min = params.get("min");
  if (min !== null && min !== "" && !Number.isNaN(Number(min))) out.minTRY = Number(min);
  const max = params.get("max");
  if (max !== null && max !== "" && !Number.isNaN(Number(max))) out.maxTRY = Number(max);
  const sort = params.get("sort");
  if (sort && (SORTS as string[]).includes(sort)) out.sort = sort as SortKey;
  return out;
}
