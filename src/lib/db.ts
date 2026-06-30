import { neon } from "@neondatabase/serverless";

// Single source for the Neon connection. Falls back to null when no DB is
// configured (e.g. local without env) so callers can degrade to demo data.
const url = process.env.DATABASE_URL;
export const sql = url ? neon(url) : null;

export function hasDb(): boolean {
  return sql !== null;
}

/** Create tables if missing. Safe to call repeatedly. */
export async function ensureSchema(): Promise<void> {
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS game_prices (
      slug             text    NOT NULL,
      store            text    NOT NULL,
      amount           numeric NOT NULL,
      currency         text    NOT NULL,
      original_amount  numeric,
      discount_percent int,
      updated_at       timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (slug, store)
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS price_history (
      slug       text    NOT NULL,
      store      text    NOT NULL,
      day        date    NOT NULL,
      try_amount numeric NOT NULL,
      PRIMARY KEY (slug, store, day)
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS fx_rate (
      base       text PRIMARY KEY,
      rate       numeric NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  // appid → ITAD game id cache ('' = looked up, not found)
  await sql`
    CREATE TABLE IF NOT EXISTS itad_map (
      appid   text PRIMARY KEY,
      itad_id text NOT NULL
    )`;
  // appid → PlayStation Store product id ('' = searched, not on PS)
  await sql`
    CREATE TABLE IF NOT EXISTS ps_map (
      appid      text PRIMARY KEY,
      product_id text NOT NULL
    )`;
  // real all-time-low per game (from ITAD)
  await sql`
    CREATE TABLE IF NOT EXISTS all_time_low (
      slug   text PRIMARY KEY,
      amount numeric NOT NULL,
      shop   text NOT NULL,
      day    text NOT NULL
    )`;
  // appid → Steam trailer movie id ('' = checked, none)
  await sql`
    CREATE TABLE IF NOT EXISTS trailer_map (
      appid    text PRIMARY KEY,
      movie_id text NOT NULL
    )`;
  // store product link per price
  await sql`ALTER TABLE game_prices ADD COLUMN IF NOT EXISTS url text`;
  // cached Steam media (screenshots, description, tags) per appid
  await sql`
    CREATE TABLE IF NOT EXISTS game_meta (
      appid      text PRIMARY KEY,
      data       jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  // Web Push subscriptions + their watched price targets
  await sql`
    CREATE TABLE IF NOT EXISTS push_subs (
      endpoint   text PRIMARY KEY,
      p256dh     text NOT NULL,
      auth       text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS push_watches (
      endpoint          text NOT NULL,
      slug              text NOT NULL,
      target_try        numeric,
      last_notified_day date,
      PRIMARY KEY (endpoint, slug)
    )`;
  // Email price alerts (double opt-in): token used for verify + unsubscribe
  await sql`
    CREATE TABLE IF NOT EXISTS email_subs (
      email      text PRIMARY KEY,
      token      text NOT NULL,
      verified   boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
  // Weekly digest opt-in (default on for every verified subscriber).
  await sql`ALTER TABLE email_subs ADD COLUMN IF NOT EXISTS digest boolean NOT NULL DEFAULT true`;
  await sql`
    CREATE TABLE IF NOT EXISTS email_watches (
      email             text NOT NULL,
      slug              text NOT NULL,
      target_try        numeric,
      last_notified_day date,
      PRIMARY KEY (email, slug)
    )`;
  // Real subscription membership per game (from ITAD games/subs), sub_id = our SubscriptionId
  await sql`
    CREATE TABLE IF NOT EXISTS game_subs (
      slug   text NOT NULL,
      sub_id text NOT NULL,
      PRIMARY KEY (slug, sub_id)
    )`;
  // Full catalog (seed of GAMES + bulk imports) — powers server-side search and
  // on-demand detail pages so the catalog can grow without bloating the client.
  await sql`
    CREATE TABLE IF NOT EXISTS catalog (
      slug       text PRIMARY KEY,
      appid      text NOT NULL DEFAULT '',
      title      text NOT NULL,
      norm       text NOT NULL DEFAULT '',
      cover      text NOT NULL DEFAULT '',
      genres     jsonb NOT NULL DEFAULT '[]',
      score      int  NOT NULL DEFAULT 0,
      year       int  NOT NULL DEFAULT 0,
      unreleased boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`ALTER TABLE catalog ADD COLUMN IF NOT EXISTS free boolean NOT NULL DEFAULT false`;
  await sql`CREATE INDEX IF NOT EXISTS catalog_norm_idx ON catalog (norm text_pattern_ops)`;
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
  // Community "heat" votes: one row per (game, anonymous device). The device id
  // is a client-generated uuid stored in localStorage; PK dedupes repeat votes
  // from the same device. ip_hash is recorded for abuse analysis only, never
  // used as identity.
  await sql`
    CREATE TABLE IF NOT EXISTS deal_votes (
      slug       text NOT NULL,
      device     text NOT NULL,
      ip_hash    text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (slug, device)
    )`;
  await sql`CREATE INDEX IF NOT EXISTS deal_votes_slug_idx ON deal_votes (slug)`;
  await sql`CREATE INDEX IF NOT EXISTS deal_votes_recent_idx ON deal_votes (created_at DESC)`;
}
