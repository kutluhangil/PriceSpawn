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
}
