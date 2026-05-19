import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

/**
 * Postgres client + Drizzle wrapper. Lazily initialised on first use so module
 * loaders (vitest, type-only imports) don't require DATABASE_URL.
 */

let _queryClient: Sql | null = null;
let _db: PostgresJsDatabase<typeof schema> | null = null;

function init(): { queryClient: Sql; db: PostgresJsDatabase<typeof schema> } {
  if (_queryClient && _db) return { queryClient: _queryClient, db: _db };

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL env var is required');
  }
  const POOL_MAX = Number(process.env.DB_POOL_MAX ?? 10);
  const IDLE_TIMEOUT = Number(process.env.DB_IDLE_TIMEOUT_SECONDS ?? 30);
  const STATEMENT_TIMEOUT_MS = Number(process.env.DB_STATEMENT_TIMEOUT_MS ?? 15_000);

  _queryClient = postgres(DATABASE_URL, {
    max: POOL_MAX,
    idle_timeout: IDLE_TIMEOUT,
    connect_timeout: 10,
    prepare: true,
    connection: {
      statement_timeout: STATEMENT_TIMEOUT_MS,
      application_name: 'bharat-leads',
    },
    debug: process.env.NODE_ENV === 'development' ? console.log : false,
  });
  _db = drizzle(_queryClient, { schema, logger: false });
  return { queryClient: _queryClient, db: _db };
}

/**
 * Drizzle client. Use `db.select()...` etc. Lazy-inits on first method access.
 * The Proxy avoids touching DATABASE_URL at module import time.
 */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_t, prop, receiver) {
    const { db } = init();
    return Reflect.get(db as object, prop, receiver);
  },
});
export type Database = PostgresJsDatabase<typeof schema>;

/**
 * Run a callback in a serializable transaction with automatic retry on
 * serialization failures (Postgres SQLSTATE 40001).
 */
export async function withTransaction<T>(fn: (tx: Database) => Promise<T>, maxRetries = 3): Promise<T> {
  const { db } = init();
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
    const { queryClient } = init();
    await queryClient`select 1`;
    return true;
  } catch {
    return false;
  }
}

/** Close the pool. Call from graceful-shutdown handlers. */
export async function closeDb(): Promise<void> {
  if (_queryClient) await _queryClient.end({ timeout: 5 });
  _queryClient = null;
  _db = null;
}
