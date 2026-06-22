// Pure membership diff. Compares old vs new subscription membership and returns
// the per-game, per-service changes. The caller owns cold-start handling: any
// service listed in `coldServices` won't emit "added" (avoids a first-fill flood).

export type Membership = Record<string, Set<string>>;

export interface Change {
  slug: string;
  subId: string;
  change: "added" | "removed";
}

const EMPTY: ReadonlySet<string> = new Set();

export function diffMembership(
  oldM: Membership,
  newM: Membership,
  services: string[],
  coldServices: Set<string>,
): Change[] {
  const out: Change[] = [];
  const slugs = new Set<string>([...Object.keys(oldM), ...Object.keys(newM)]);
  for (const slug of slugs) {
    const oldSubs = oldM[slug] ?? EMPTY;
    const newSubs = newM[slug] ?? EMPTY;
    for (const subId of services) {
      const inOld = oldSubs.has(subId);
      const inNew = newSubs.has(subId);
      if (inNew && !inOld) {
        if (!coldServices.has(subId)) out.push({ slug, subId, change: "added" });
      } else if (inOld && !inNew) {
        out.push({ slug, subId, change: "removed" });
      }
    }
  }
  return out;
}
