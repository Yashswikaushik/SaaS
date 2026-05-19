import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Postgres client + Drizzle wrapper.
 * Connection pooling: 10 by default, overridable via DB_POOL_MAX.
 * Uses prepared statements for query plan caching.
 */

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL env var is required');
}

const POOL_MAX = Number(process.env.DB_POOL_MAX ?? 10);
const IDLE_TIMEOUT = Number(process.env.DB_IDLE_TIMEOUT_SECONDS ?? 30);
const STATEMENT_TIMEOUT_MS = Number(process.env.DB_STATEMENT_TIMEOUT_MS ?? 15_000);

const queryClient = postgres(DATABASE_URL, {
  max: POOL_MAX,
  idle_timeout: IDLE_TIMEOUT,
  connect_timeout: 10,
  prepare: true,
  connection: {
    statement_timeout: STATEMENT_TIMEOUT_MS,
    application_name: 'bharat-leads',
  },
  // No verbose logging in production — leaks PII into stdout.
  debug: process.env.NODE_ENV === 'development' ? console.log : false,
});

export const db = drizzle(queryClient, { schema, logger: false });
export type Database = typeof db;

/**
 * Run a callback in a serializable transaction with automatic retry on
 * serialization failures (Postgres SQLSTATE 40001).
 */
export async function withTransaction<T>(fn: (tx: Database) => Promise<T>, maxRetries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await db.transaction(async (tx) => fn(tx as unknown as Database), {
        isolationLevel: 'serializable',
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === '40001' && i < maxRetries - 1) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 50 * 2 ** i));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/** Health check — used by `/api/health` and worker liveness probes. */
export async function pingDb(): Promise<boolean> {
  try {
    await queryClient`select 1`;
    return true;
  } catch {
    return false;
  }
}

/** Close the pool. Call from graceful-shutdown handlers. */
export async function closeDb(): Promise<void> {
  await queryClient.end({ timeout: 5 });
}
