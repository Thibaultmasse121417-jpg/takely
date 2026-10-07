/**
 * Applies supabase/migrations/*.sql in order, once each, before every build.
 * Uses the direct Postgres URL the Vercel ↔ Supabase integration provides
 * (POSTGRES_URL_NON_POOLING). Without it (local dev, CI) it does nothing.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] no POSTGRES_URL_NON_POOLING: skipping database migrations");
  process.exit(0);
}

const dir = join(process.cwd(), "supabase/migrations");
const files = readdirSync(dir).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();

// Supabase's pooled/direct URLs use certificates Node doesn't know; the connection is still encrypted.
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const client = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]+/, ""),
  ssl: local ? false : { rejectUnauthorized: false },
});
await client.connect();
try {
  await client.query(`create table if not exists public._takely_migrations (name text primary key, applied_at timestamptz not null default now())`);
  await client.query(`alter table public._takely_migrations enable row level security`);
  const done = new Set((await client.query(`select name from public._takely_migrations`)).rows.map((r) => r.name as string));
  for (const f of files) {
    if (done.has(f)) continue;
    const sql = readFileSync(join(dir, f), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(`insert into public._takely_migrations (name) values ($1)`, [f]);
      await client.query("commit");
      console.log(`[migrate] applied ${f}`);
    } catch (e) {
      await client.query("rollback");
      throw new Error(`[migrate] ${f} failed: ${(e as Error).message}`);
    }
  }
  console.log("[migrate] database up to date");
} finally {
  await client.end();
}
