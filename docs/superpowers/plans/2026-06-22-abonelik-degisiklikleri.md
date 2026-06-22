# Abonelik Giriş/Çıkış Takibi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abonelik kataloglarına (Game Pass, PS Plus, EA Play, Ubisoft+, Prime) eklenen/kaldırılan oyunları gerçek diff'le tespit edip iki yüzeyde (özet + adanmış sayfa) göstermek.

**Architecture:** Mevcut `refresh-subs`/`refresh-psplus` job'ları üyeliği yeniden yazmadan ÖNCE eski durumu okur, saf `diffMembership` fonksiyonuyla yeni durumla karşılaştırır, delta'yı yeni `sub_changes` tablosuna yazar. Okuma katmanı (`sub-changes.ts`) bu tabloyu `catalog` ile join'ler. UI: `/abonelikler` üstünde özet + `/abonelikler/degisiklikler` adanmış sayfa.

**Tech Stack:** Next 16 App Router (server components + ISR), React 19, Neon Postgres (`@neondatabase/serverless`), Tailwind v4, TypeScript, Vitest.

## Global Constraints

- **SAHTE VERİ YASAK.** Sadece diff'ten türeyen gerçek değişim. "Yakında ayrılacak" YOK.
- **Next 16 farklı:** kod yazmadan ilgili `node_modules/next/dist/docs` rehberini oku.
- **next/image quality:** `next.config` `images.qualities` dışı `q` değeri HTTP 400 → buğu. Kapaklar `CoverImage` üzerinden.
- Testler `tests/**/*.test.ts` altında (co-located DEĞİL). Vitest alias `@` → `src`.
- `Dict` tipi = `Record<keyof typeof tr, string>` → `tr.ts` ve `en.ts` anahtarları birebir eşleşmeli (tsc enforce eder).
- `game_subs` rewrite deseni korunur: `refresh-subs` ITAD servislerinin sahibi, `refresh-psplus` yalnız `psplus`. Her job sadece kendi servislerini diff'ler.
- Soğuk başlangıç: bir servisin eski durumunda HİÇ satır yoksa o servis için `added` KAYDETME.

---

## File Structure

- **Create** `src/lib/sub-diff.ts` — saf diff fonksiyonu (`diffMembership`, tipler).
- **Create** `tests/sub-diff.test.ts` — birim testler.
- **Modify** `src/lib/db.ts` — `ensureSchema`'ya `sub_changes` tablosu + index.
- **Create** `src/lib/sub-changes.ts` — okuma katmanı (`recentChangeSummary`, `recentChanges`, tipler).
- **Modify** `src/app/api/refresh-subs/route.ts` — rewrite öncesi diff + `sub_changes` insert.
- **Modify** `scripts/refresh-subs.mjs` — aynı diff (inline JS).
- **Modify** `src/app/api/refresh-psplus/route.ts` — psplus diff + insert.
- **Modify** `src/i18n/tr.ts`, `src/i18n/en.ts` — UI stringleri.
- **Create** `src/components/sub-change-summary.tsx` — özet bölümü (client).
- **Modify** `src/app/abonelikler/page.tsx` — server-side özet fetch + render.
- **Create** `src/app/abonelikler/degisiklikler/page.tsx` — adanmış sayfa (server, ISR).
- **Create** `src/components/sub-changes-content.tsx` — filtreli liste (client, URL state).
- **Modify** `src/app/sitemap.ts` — yeni route'u ekle.

---

### Task 1: Saf diff fonksiyonu (`sub-diff.ts`)

**Files:**
- Create: `src/lib/sub-diff.ts`
- Test: `tests/sub-diff.test.ts`

**Interfaces:**
- Consumes: yok.
- Produces:
  - `type Membership = Record<string, Set<string>>`
  - `interface Change { slug: string; subId: string; change: "added" | "removed" }`
  - `function diffMembership(oldM: Membership, newM: Membership, services: string[], coldServices: Set<string>): Change[]`

- [ ] **Step 1: Write the failing test**

`tests/sub-diff.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { diffMembership, type Membership } from "@/lib/sub-diff";

const m = (obj: Record<string, string[]>): Membership =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, new Set(v)]));

describe("diffMembership", () => {
  it("cold service: skips 'added' when old has no rows for that service", () => {
    const out = diffMembership(m({}), m({ a: ["gamepass"], b: ["gamepass"] }), ["gamepass"], new Set(["gamepass"]));
    expect(out).toEqual([]);
  });

  it("detects added and removed for a warm service", () => {
    const old = m({ a: ["gamepass"], b: ["gamepass"] });
    const next = m({ a: ["gamepass"], c: ["gamepass"] });
    const out = diffMembership(old, next, ["gamepass"], new Set());
    expect(out).toContainEqual({ slug: "c", subId: "gamepass", change: "added" });
    expect(out).toContainEqual({ slug: "b", subId: "gamepass", change: "removed" });
    expect(out).toHaveLength(2);
  });

  it("ignores services not owned by this job", () => {
    const out = diffMembership(m({ a: ["psplus"] }), m({ a: [] }), ["gamepass"], new Set());
    expect(out).toEqual([]);
  });

  it("re-entry: removal in one call, add in a later call (pure contract)", () => {
    const leave = diffMembership(m({ a: ["gamepass"] }), m({}), ["gamepass"], new Set());
    expect(leave).toEqual([{ slug: "a", subId: "gamepass", change: "removed" }]);
    const back = diffMembership(m({}), m({ a: ["gamepass"] }), ["gamepass"], new Set());
    expect(back).toEqual([{ slug: "a", subId: "gamepass", change: "added" }]);
  });

  it("no change when membership is identical", () => {
    const same = m({ a: ["gamepass", "eaplay"] });
    expect(diffMembership(same, m({ a: ["gamepass", "eaplay"] }), ["gamepass", "eaplay"], new Set())).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sub-diff.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/sub-diff"` / `diffMembership is not a function`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/sub-diff.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sub-diff.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/sub-diff.ts tests/sub-diff.test.ts
git commit -m "feat(subs): pure diffMembership for catalog change detection"
```

---

### Task 2: DB şeması + okuma katmanı

**Files:**
- Modify: `src/lib/db.ts` (`ensureSchema`, son `await sql\`ALTER TABLE catalog ...\`` ve index'ten sonra)
- Create: `src/lib/sub-changes.ts`

**Interfaces:**
- Consumes: `sql`, `hasDb` from `@/lib/db`; `SubscriptionId` from `@/lib/subscriptions`.
- Produces:
  - `interface SubChangeItem { slug: string; title: string; cover: string; subId: SubscriptionId; change: "added" | "removed"; day: string }`
  - `interface SubChangeSummaryEntry { subId: SubscriptionId; added: number; removed: number; sampleCovers: string[] }`
  - `function recentChangeSummary(days?: number): Promise<SubChangeSummaryEntry[]>`
  - `function recentChanges(limit?: number): Promise<SubChangeItem[]>`

- [ ] **Step 1: Add the `sub_changes` table to `ensureSchema`**

In `src/lib/db.ts`, immediately before the final closing `}` of `ensureSchema` (after the `catalog_norm_idx` line), add:
```ts
  // Subscription catalog changes (added/removed), derived by diffing membership
  // on each refresh. Powers the /abonelikler change surfaces.
  await sql`
    CREATE TABLE IF NOT EXISTS sub_changes (
      slug   text NOT NULL,
      sub_id text NOT NULL,
      change text NOT NULL,
      day    date NOT NULL,
      PRIMARY KEY (slug, sub_id, day, change)
    )`;
  await sql`CREATE INDEX IF NOT EXISTS sub_changes_recent_idx ON sub_changes (sub_id, day DESC)`;
```

- [ ] **Step 2: Create the read layer**

`src/lib/sub-changes.ts`:
```ts
import { sql, hasDb } from "@/lib/db";
import type { SubscriptionId } from "@/lib/subscriptions";

export interface SubChangeItem {
  slug: string;
  title: string;
  cover: string;
  subId: SubscriptionId;
  change: "added" | "removed";
  day: string; // YYYY-MM-DD
}

export interface SubChangeSummaryEntry {
  subId: SubscriptionId;
  added: number;
  removed: number;
  sampleCovers: string[]; // up to 4 recently-added covers
}

/** Per-service added/removed counts (+ a few added covers) over the last N days. */
export async function recentChangeSummary(days = 30): Promise<SubChangeSummaryEntry[]> {
  if (!hasDb()) return [];
  try {
    const counts = (await sql!`
      SELECT sub_id, change, COUNT(*)::int AS n
      FROM sub_changes
      WHERE day >= CURRENT_DATE - ${days}::int
      GROUP BY sub_id, change`) as { sub_id: string; change: string; n: number }[];
    const covers = (await sql!`
      SELECT sc.sub_id, cat.cover
      FROM sub_changes sc
      JOIN catalog cat ON cat.slug = sc.slug
      WHERE sc.change = 'added' AND sc.day >= CURRENT_DATE - ${days}::int AND cat.cover <> ''
      ORDER BY sc.day DESC`) as { sub_id: string; cover: string }[];

    const byId = new Map<string, SubChangeSummaryEntry>();
    const ensure = (id: string) => {
      let e = byId.get(id);
      if (!e) {
        e = { subId: id as SubscriptionId, added: 0, removed: 0, sampleCovers: [] };
        byId.set(id, e);
      }
      return e;
    };
    for (const r of counts) {
      const e = ensure(r.sub_id);
      if (r.change === "added") e.added = r.n;
      else if (r.change === "removed") e.removed = r.n;
    }
    for (const r of covers) {
      const e = ensure(r.sub_id);
      if (e.sampleCovers.length < 4) e.sampleCovers.push(r.cover);
    }
    return [...byId.values()].sort((a, b) => b.added + b.removed - (a.added + a.removed));
  } catch {
    return [];
  }
}

/** Recent changes (newest first), joined to catalog for title/cover. */
export async function recentChanges(limit = 500): Promise<SubChangeItem[]> {
  if (!hasDb()) return [];
  try {
    const rows = (await sql!`
      SELECT sc.slug, cat.title, cat.cover, sc.sub_id, sc.change, sc.day::text AS day
      FROM sub_changes sc
      JOIN catalog cat ON cat.slug = sc.slug
      ORDER BY sc.day DESC, cat.title ASC
      LIMIT ${limit}`) as {
      slug: string; title: string; cover: string; sub_id: string; change: string; day: string;
    }[];
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      cover: r.cover,
      subId: r.sub_id as SubscriptionId,
      change: r.change === "removed" ? "removed" : "added",
      day: r.day,
    }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Verify types + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts src/lib/sub-changes.ts
git commit -m "feat(subs): sub_changes table + read layer"
```

---

### Task 3: `refresh-subs` diff yakalama (route + script)

**Files:**
- Modify: `src/app/api/refresh-subs/route.ts`
- Modify: `scripts/refresh-subs.mjs`

**Interfaces:**
- Consumes: `diffMembership`, `Membership` from `@/lib/sub-diff` (Task 1); `sub_changes` table (Task 2).
- Produces: `sub_changes` rows for ITAD services on each run.

- [ ] **Step 1: Import the diff helper in the route**

In `src/app/api/refresh-subs/route.ts`, extend the existing import line:
```ts
import { itadSubs } from "@/lib/fetchers";
```
to add a new import below it:
```ts
import { diffMembership, type Membership } from "@/lib/sub-diff";
```

- [ ] **Step 2: Capture the diff before the rewrite**

In the same file, the block currently reads:
```ts
  // Rewrite only the ITAD-owned services; PlayStation Plus is managed separately
  // (console-only, not tracked by ITAD) via /api/refresh-psplus.
  await sql!`DELETE FROM game_subs WHERE sub_id <> 'psplus'`;
```
Insert the following ABOVE that `DELETE` (between the `bySlug` loop and the delete):
```ts
  // Capture catalog changes (added/removed) by diffing the previous ITAD-owned
  // membership against the freshly computed one, before the rewrite destroys it.
  const ITAD_SERVICES = ["gamepass", "eaplay", "eaplaypro", "ubisoftplus", "luna"];
  const oldRows = (await sql!`SELECT slug, sub_id FROM game_subs WHERE sub_id <> 'psplus'`) as {
    slug: string;
    sub_id: string;
  }[];
  const oldM: Membership = {};
  for (const r of oldRows) (oldM[r.slug] ??= new Set()).add(r.sub_id);
  const warm = new Set<string>();
  for (const set of Object.values(oldM)) for (const s of set) warm.add(s);
  const coldServices = new Set(ITAD_SERVICES.filter((s) => !warm.has(s)));
  const newM: Membership = Object.fromEntries(bySlug);
  const changes = diffMembership(oldM, newM, ITAD_SERVICES, coldServices);
  const today = new Date().toISOString().slice(0, 10);
  for (const ch of changes) {
    await sql!`INSERT INTO sub_changes (slug, sub_id, change, day)
      VALUES (${ch.slug}, ${ch.subId}, ${ch.change}, ${today}) ON CONFLICT DO NOTHING`;
  }
```

- [ ] **Step 3: Surface the count in the response**

In the same file, change the final return from:
```ts
  return NextResponse.json({ ok: true, queried: ids.length, games: bySlug.size, rows, tally });
```
to:
```ts
  return NextResponse.json({ ok: true, queried: ids.length, games: bySlug.size, rows, changes: changes.length, tally });
```

- [ ] **Step 4: Mirror the diff in the standalone script**

In `scripts/refresh-subs.mjs`, the block currently reads:
```js
// Rewrite ITAD-owned services; psplus is managed separately.
await sql`DELETE FROM game_subs WHERE sub_id <> 'psplus'`;
```
Insert the following ABOVE that `DELETE` (after `console.log("games with subs:", bySlug.size);`):
```js
// Ensure the change table exists (route's ensureSchema may not have run here).
await sql`CREATE TABLE IF NOT EXISTS sub_changes (
  slug text NOT NULL, sub_id text NOT NULL, change text NOT NULL, day date NOT NULL,
  PRIMARY KEY (slug, sub_id, day, change))`;

// Capture added/removed by diffing the previous ITAD membership before rewrite.
const ITAD_SERVICES = ["gamepass", "eaplay", "eaplaypro", "ubisoftplus", "luna"];
const oldRows = await sql`SELECT slug, sub_id FROM game_subs WHERE sub_id <> 'psplus'`;
const oldM = new Map();
for (const r of oldRows) { if (!oldM.has(r.slug)) oldM.set(r.slug, new Set()); oldM.get(r.slug).add(r.sub_id); }
const warm = new Set();
for (const set of oldM.values()) for (const s of set) warm.add(s);
const coldServices = new Set(ITAD_SERVICES.filter((s) => !warm.has(s)));
const today = new Date().toISOString().slice(0, 10);
const changeRows = [];
const allSlugs = new Set([...oldM.keys(), ...bySlug.keys()]);
for (const slug of allSlugs) {
  const oldSet = oldM.get(slug) ?? new Set();
  const newSet = bySlug.get(slug) ?? new Set();
  for (const s of ITAD_SERVICES) {
    const inOld = oldSet.has(s), inNew = newSet.has(s);
    if (inNew && !inOld) { if (!coldServices.has(s)) changeRows.push([slug, s, "added"]); }
    else if (inOld && !inNew) changeRows.push([slug, s, "removed"]);
  }
}
for (const [slug, s, change] of changeRows) {
  await sql`INSERT INTO sub_changes (slug, sub_id, change, day) VALUES (${slug}, ${s}, ${change}, ${today}) ON CONFLICT DO NOTHING`;
}
console.log("sub_changes recorded:", changeRows.length);
```

- [ ] **Step 5: Verify types + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/refresh-subs/route.ts scripts/refresh-subs.mjs
git commit -m "feat(subs): record ITAD catalog changes on refresh"
```

---

### Task 4: `refresh-psplus` diff yakalama

**Files:**
- Modify: `src/app/api/refresh-psplus/route.ts`

**Interfaces:**
- Consumes: `diffMembership`, `Membership` from `@/lib/sub-diff` (Task 1); `sub_changes` table (Task 2).
- Produces: `sub_changes` rows for `psplus` on each run.

- [ ] **Step 1: Import the diff helper**

In `src/app/api/refresh-psplus/route.ts`, after the existing import:
```ts
import { normTitle } from "@/lib/normalize-title";
```
add:
```ts
import { diffMembership, type Membership } from "@/lib/sub-diff";
```

- [ ] **Step 2: Capture the diff before the rewrite**

The block currently reads:
```ts
  await sql!`DELETE FROM game_subs WHERE sub_id = 'psplus'`;
  for (const slug of matched) {
```
Insert the following ABOVE that `DELETE`:
```ts
  // Capture psplus catalog changes before the rewrite.
  const oldRows = (await sql!`SELECT slug FROM game_subs WHERE sub_id = 'psplus'`) as { slug: string }[];
  const oldM: Membership = {};
  for (const r of oldRows) oldM[r.slug] = new Set(["psplus"]);
  const newM: Membership = {};
  for (const slug of matched) newM[slug] = new Set(["psplus"]);
  const coldServices = oldRows.length === 0 ? new Set(["psplus"]) : new Set<string>();
  const changes = diffMembership(oldM, newM, ["psplus"], coldServices);
  const today = new Date().toISOString().slice(0, 10);
  for (const ch of changes) {
    await sql!`INSERT INTO sub_changes (slug, sub_id, change, day)
      VALUES (${ch.slug}, ${ch.subId}, ${ch.change}, ${today}) ON CONFLICT DO NOTHING`;
  }
```

- [ ] **Step 3: Surface the count in the response**

Change the final return from:
```ts
    matched: matched.size,
    missedCount: missed.length,
    missedSample: missed.slice(0, 20),
  });
```
to:
```ts
    matched: matched.size,
    changes: changes.length,
    missedCount: missed.length,
    missedSample: missed.slice(0, 20),
  });
```

- [ ] **Step 4: Verify types + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/refresh-psplus/route.ts
git commit -m "feat(subs): record PS Plus catalog changes on refresh"
```

---

### Task 5: i18n stringleri

**Files:**
- Modify: `src/i18n/tr.ts` (before the final `} as const;`)
- Modify: `src/i18n/en.ts` (before the final `};`)

**Interfaces:**
- Produces: dict keys `subChangesPage, subChangesDesc, subActivity, subAdded, subRemoved, subLast30, subSeeAll, subAllServices, subNoChanges` (used by Tasks 6–7).

- [ ] **Step 1: Add Turkish strings**

In `src/i18n/tr.ts`, immediately before `} as const;`, add:
```ts
  // abonelik değişiklikleri
  subChangesPage: "Abonelik Değişiklikleri",
  subChangesDesc: "Abonelik kataloglarına eklenen ve kaldırılan oyunlar.",
  subActivity: "Abonelik Hareketleri",
  subAdded: "Eklenenler",
  subRemoved: "Kaldırılanlar",
  subLast30: "Son 30 gün",
  subSeeAll: "Tümünü gör →",
  subAllServices: "Tüm servisler",
  subNoChanges: "Henüz kayıtlı değişiklik yok.",
```

- [ ] **Step 2: Add English strings**

In `src/i18n/en.ts`, immediately before the final `};`, add:
```ts
  // subscription changes
  subChangesPage: "Subscription Changes",
  subChangesDesc: "Games added to and removed from subscription catalogs.",
  subActivity: "Subscription Activity",
  subAdded: "Added",
  subRemoved: "Removed",
  subLast30: "Last 30 days",
  subSeeAll: "See all →",
  subAllServices: "All services",
  subNoChanges: "No recorded changes yet.",
```

- [ ] **Step 3: Verify dict parity (tsc)**

Run: `npx tsc --noEmit`
Expected: no errors. (A missing/extra key in either file breaks the `Dict` type.)

- [ ] **Step 4: Commit**

```bash
git add src/i18n/tr.ts src/i18n/en.ts
git commit -m "feat(i18n): subscription change strings (tr/en)"
```

---

### Task 6: Özet bölümü + `/abonelikler` entegrasyonu

**Files:**
- Create: `src/components/sub-change-summary.tsx`
- Modify: `src/app/abonelikler/page.tsx`

**Interfaces:**
- Consumes: `SubChangeSummaryEntry`, `recentChangeSummary` from `@/lib/sub-changes` (Task 2); `SUBSCRIPTIONS` from `@/lib/subscriptions`; `useApp`; `CoverImage`; `SubLogo`.
- Produces: `<SubChangeSummary summary={SubChangeSummaryEntry[]} />`.

- [ ] **Step 1: Create the summary component**

`src/components/sub-change-summary.tsx`:
```tsx
"use client";

import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { SubLogo } from "@/components/store-logo";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { useApp } from "@/components/providers";
import type { SubChangeSummaryEntry } from "@/lib/sub-changes";

export function SubChangeSummary({ summary }: { summary: SubChangeSummaryEntry[] }) {
  const { t } = useApp();
  const active = summary.filter((s) => s.added + s.removed > 0 && SUBSCRIPTIONS[s.subId]);
  if (active.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-bright">{t.subActivity}</h2>
          <p className="text-xs text-muted">{t.subLast30}</p>
        </div>
        <Link href="/abonelikler/degisiklikler" className="text-xs font-semibold text-accent hover:text-bright">
          {t.subSeeAll}
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {active.map((s) => {
          const sub = SUBSCRIPTIONS[s.subId];
          return (
            <Link
              key={s.subId}
              href={`/abonelikler/degisiklikler?sub=${s.subId}`}
              className="panel flex items-center justify-between gap-3 rounded-[var(--radius-card)] px-4 py-3 transition-transform hover:scale-[1.005]"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-bold" style={{ color: sub.accent }}>
                <SubLogo id={s.subId} size={18} /> <span className="truncate">{sub.label}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-xs font-bold tabular-nums">
                {s.added > 0 && <span className="text-emerald-400">+{s.added} {t.subAdded}</span>}
                {s.removed > 0 && <span className="text-rose-400">−{s.removed} {t.subRemoved}</span>}
                <span className="flex -space-x-3">
                  {s.sampleCovers.slice(0, 3).map((c, i) => (
                    <CoverImage key={i} src={c} title="" className="h-8 w-14 rounded-md ring-1 ring-border" />
                  ))}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire it into the subscriptions page (server fetch)**

Replace the whole body of `src/app/abonelikler/page.tsx` with:
```tsx
import type { Metadata } from "next";
import { SubsContent } from "@/components/subs-content";
import { SubChangeSummary } from "@/components/sub-change-summary";
import { recentChangeSummary } from "@/lib/sub-changes";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Abonelik Değeri — ${SITE_NAME}`,
  description: "Game Pass, PS Plus, EA Play ve diğer aboneliklerin oyun değeri.",
};

export const revalidate = 3600;

export default async function SubsPage() {
  const summary = await recentChangeSummary(30);
  return (
    <div className="mx-auto w-[min(100%-2rem,64rem)] pt-8">
      <SubChangeSummary summary={summary} />
      <SubsContent />
    </div>
  );
}
```

Note: `SubsContent` keeps its own inner `mx-auto` wrapper; the extra outer wrapper here only hosts the summary band and is harmless (both clamp to the same max width). Leave `subs-content.tsx` unchanged.

- [ ] **Step 3: Verify types + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/sub-change-summary.tsx src/app/abonelikler/page.tsx
git commit -m "feat(subs): subscription activity summary on /abonelikler"
```

---

### Task 7: Adanmış sayfa + filtreli içerik + sitemap

**Files:**
- Create: `src/app/abonelikler/degisiklikler/page.tsx`
- Create: `src/components/sub-changes-content.tsx`
- Modify: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `SubChangeItem`, `recentChanges` from `@/lib/sub-changes` (Task 2); `SUBSCRIPTIONS`; `useApp`; `CoverImage`; `SubLogo`; `next/navigation` (`useRouter`, `useSearchParams`).
- Produces: route `/abonelikler/degisiklikler`.

- [ ] **Step 1: Create the dedicated page (server, ISR)**

`src/app/abonelikler/degisiklikler/page.tsx`:
```tsx
import type { Metadata } from "next";
import { SubChangesContent } from "@/components/sub-changes-content";
import { recentChanges } from "@/lib/sub-changes";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Abonelik Değişiklikleri — ${SITE_NAME}`,
  description: "Game Pass, PS Plus, EA Play ve Ubisoft+ kataloglarına eklenen ve kaldırılan oyunlar.",
};

export const revalidate = 3600;

export default async function SubChangesPage() {
  const changes = await recentChanges(500);
  return <SubChangesContent changes={changes} />;
}
```

- [ ] **Step 2: Create the filtered content component (client, URL state)**

`src/components/sub-changes-content.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { SubLogo } from "@/components/store-logo";
import { SUBSCRIPTIONS, type SubscriptionId } from "@/lib/subscriptions";
import { useApp } from "@/components/providers";
import type { SubChangeItem } from "@/lib/sub-changes";

export function SubChangesContent({ changes }: { changes: SubChangeItem[] }) {
  const { t, locale } = useApp();
  const router = useRouter();
  const params = useSearchParams();

  const subFilter = (params.get("sub") ?? "") as SubscriptionId | "";
  const changeFilter = params.get("type") === "removed" ? "removed" : params.get("type") === "added" ? "added" : "";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/abonelikler/degisiklikler${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  const services = useMemo(() => {
    const seen = new Set<string>();
    for (const c of changes) if (SUBSCRIPTIONS[c.subId]) seen.add(c.subId);
    return [...seen] as SubscriptionId[];
  }, [changes]);

  const filtered = useMemo(
    () =>
      changes.filter(
        (c) =>
          SUBSCRIPTIONS[c.subId] &&
          (!subFilter || c.subId === subFilter) &&
          (!changeFilter || c.change === changeFilter),
      ),
    [changes, subFilter, changeFilter],
  );

  const groups = useMemo(() => {
    const map = new Map<string, SubChangeItem[]>();
    for (const c of filtered) {
      const arr = map.get(c.day) ?? [];
      arr.push(c);
      map.set(c.day, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const fmtDay = (d: string) =>
    new Date(d).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto w-[min(100%-2rem,64rem)] pt-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-bright sm:text-3xl">{t.subChangesPage}</h1>
      <p className="mb-5 max-w-2xl text-sm text-muted">{t.subChangesDesc}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        <Chip active={!subFilter} onClick={() => setParam("sub", "")}>{t.subAllServices}</Chip>
        {services.map((id) => (
          <Chip key={id} active={subFilter === id} onClick={() => setParam("sub", id)} accent={SUBSCRIPTIONS[id].accent}>
            <SubLogo id={id} size={14} /> {SUBSCRIPTIONS[id].label}
          </Chip>
        ))}
        <span className="mx-1 w-px self-stretch bg-border" />
        <Chip active={changeFilter === "added"} onClick={() => setParam("type", changeFilter === "added" ? "" : "added")}>
          {t.subAdded}
        </Chip>
        <Chip active={changeFilter === "removed"} onClick={() => setParam("type", changeFilter === "removed" ? "" : "removed")}>
          {t.subRemoved}
        </Chip>
      </div>

      {groups.length === 0 ? (
        <div className="panel rounded-[var(--radius-card)] px-5 py-10 text-center text-sm text-muted">{t.subNoChanges}</div>
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">{fmtDay(day)}</h2>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {items.map((c) => {
                  const sub = SUBSCRIPTIONS[c.subId];
                  return (
                    <li key={`${c.slug}-${c.subId}-${c.change}`}>
                      <Link
                        href={`/oyun/${c.slug}`}
                        className="panel flex items-center gap-3 rounded-[var(--radius-card)] p-2.5 transition-transform hover:scale-[1.005]"
                      >
                        <CoverImage src={c.cover} title={c.title} className="h-12 w-[88px] shrink-0 rounded-md" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-bright">{c.title}</div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: sub.accent }}>
                            <SubLogo id={c.subId} size={12} /> {sub.label}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            c.change === "added" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                          }`}
                        >
                          {c.change === "added" ? t.subAdded : t.subRemoved}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  accent,
  children,
}: {
  active: boolean;
  onClick: () => void;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active && accent ? { borderColor: accent, color: accent } : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        active ? "border-accent text-bright" : "border-border text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Add the route to the sitemap**

In `src/app/sitemap.ts`, change the `staticRoutes` array from:
```ts
  const staticRoutes = ["", "/oyunlar", "/ucretsiz", "/takip", "/abonelikler", "/paketler", "/explorer"].map((p) => ({
```
to:
```ts
  const staticRoutes = ["", "/oyunlar", "/ucretsiz", "/takip", "/abonelikler", "/abonelikler/degisiklikler", "/paketler", "/explorer"].map((p) => ({
```

- [ ] **Step 4: Verify types + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/abonelikler/degisiklikler/page.tsx src/components/sub-changes-content.tsx src/app/sitemap.ts
git commit -m "feat(subs): /abonelikler/degisiklikler change feed + sitemap"
```

---

## Self-Review Notes

- **Spec coverage:** veri modeli → T2; diff + soğuk başlangıç → T1/T3/T4; refresh entegrasyonu (her iki job) → T3/T4; okuma katmanı → T2; özet → T6; adanmış sayfa + filtre/URL state → T7; i18n → T5; test → T1; SEO (metadata/revalidate/sitemap) → T6/T7. Kapsam dışı (v2 uyarı/yakında-ayrılacak) eklenmedi — doğru.
- **Type consistency:** `Membership`, `Change`, `diffMembership(old,new,services,coldServices)` T1↔T3↔T4 tutarlı. `SubChangeItem`/`SubChangeSummaryEntry` T2↔T6↔T7 tutarlı. `recentChangeSummary(days)`/`recentChanges(limit)` imzaları eşleşiyor.
- **No placeholders:** her kod adımı tam içerik. DB-bağımlı fonksiyonlar (kod tabanı deseni gereği) birim test edilmez; doğrulama tsc+lint. Saf diff TDD ile test edilir.
