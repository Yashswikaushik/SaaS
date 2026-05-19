import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Mixin for every table: primary key + standard timestamps + soft-delete.
 * Use `...timestamps()` in `pgTable` definitions.
 */
export const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .default(sql`now()`),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
});

export const pk = () =>
  uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`);
