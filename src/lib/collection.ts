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
