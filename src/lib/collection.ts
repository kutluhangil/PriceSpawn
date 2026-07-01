/** Games the user marks as owned. Stored client-side (no account needed). */

export function isOwned(list: string[], slug: string): boolean {
  return list.includes(slug);
}

export function addOwned(list: string[], slug: string): string[] {
  return isOwned(list, slug) ? list : [...list, slug];
}

export function removeOwned(list: string[], slug: string): string[] {
  return list.filter((s) => s !== slug);
}

export function toggleOwned(list: string[], slug: string): string[] {
  return isOwned(list, slug) ? removeOwned(list, slug) : addOwned(list, slug);
}

/** Bulk add (e.g. Steam library import); de-dupes against list and itself. */
export function addManyOwned(list: string[], slugs: string[]): string[] {
  const seen = new Set(list);
  const next = [...list];
  for (const slug of slugs) {
    if (!seen.has(slug)) {
      seen.add(slug);
      next.push(slug);
    }
  }
  return next;
}
