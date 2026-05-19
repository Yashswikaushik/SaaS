import { sql } from 'drizzle-orm';
import { index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { pk, timestamps } from './_common';
import { orgs } from './orgs';
import { users } from './users';

export const territories = pgTable(
  'territories',
  {
    id: pk(),
    orgId: uuid('org_id')
      .references(() => orgs.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    /** GeoJSON Polygon. Stored as JSONB for query convenience. */
    polygon: jsonb('polygon')
      .$type<{
        type: 'Polygon';
        coordinates: Array<Array<[number, number]>>;
      }>()
      .notNull(),
    assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
    color: text('color').notNull().default('#3b82f6'),
    ...timestamps(),
  },
  (t) => ({
    orgIdx: index('territories_org_idx').on(t.orgId),
    assignedIdx: index('territories_assigned_idx').on(t.assignedUserId),
  }),
);

export type Territory = typeof territories.$inferSelect;
