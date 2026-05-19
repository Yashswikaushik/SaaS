import { sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { pk, timestamps } from './_common';
import { orgs } from './orgs';
import { users } from './users';

export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'qualified',
  'meeting_set',
  'won',
  'lost',
  'on_hold',
]);

export const sourceMethodEnum = pgEnum('lead_source_method', [
  'geoapify_api',
  'owner_website',
  'user_provided',
  'csv_import',
]);

export const leads = pgTable(
  'leads',
  {
    id: pk(),
    orgId: uuid('org_id')
      .references(() => orgs.id, { onDelete: 'cascade' })
      .notNull(),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    /** Canonical URL the data was sourced from — required by DPDP §3(c)(ii). */
    sourceUrl: text('source_url').notNull(),
    sourceMethod: sourceMethodEnum('source_method').notNull(),
    sourceVerifiedAt: timestamp('source_verified_at', { withTimezone: true }).notNull(),
    /** External id, e.g. Geoapify place_id. Dedup key with sourceMethod. */
    externalId: text('external_id'),
    businessName: text('business_name').notNull(),
    category: text('category'),
    /** WGS84 coordinates. */
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    addressFormatted: text('address_formatted'),
    city: text('city'),
    state: text('state'),
    pincode: varchar('pincode', { length: 6 }),
    countryCode: varchar('country_code', { length: 2 }).notNull().default('IN'),
    /** Aggregated contact info — structured for typed access. */
    contact: jsonb('contact')
      .$type<{
        landline?: string;
        mobile?: string;
        email?: string;
        website?: string;
        whatsapp?: string;
        socials?: Record<string, string>;
      }>()
      .notNull()
      .default({}),
    /** Reviews and rating snapshot — never used as primary content store. */
    reviews: jsonb('reviews')
      .$type<{
        provider: 'geoapify';
        rating?: number;
        count?: number;
        snippets?: Array<{ author?: string; text: string; rating?: number; date?: string }>;
      } | null>()
      .default(null),
    aiReviewSummary: text('ai_review_summary'),
    aiReviewSummaryAt: timestamp('ai_review_summary_at', { withTimezone: true }),
    status: leadStatusEnum('status').notNull().default('new'),
    /** Dropped during search but kept for audit. */
    isHidden: boolean('is_hidden').notNull().default(false),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().notNull().default({}),
    lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
    notesCount: integer('notes_count').notNull().default(0),
    ...timestamps(),
  },
  (t) => ({
    orgCreatedIdx: index('leads_org_created_idx').on(t.orgId, t.createdAt.desc()),
    orgStatusIdx: index('leads_org_status_idx').on(t.orgId, t.status),
    orgOwnerIdx: index('leads_org_owner_idx').on(t.orgId, t.ownerUserId),
    geoIdx: index('leads_geo_idx').on(t.lat, t.lng),
    extIdUq: uniqueIndex('leads_external_id_uq')
      .on(t.orgId, t.sourceMethod, t.externalId)
      .where(sql`${t.externalId} is not null`),
  }),
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export const leadNotes = pgTable(
  'lead_notes',
  {
    id: pk(),
    leadId: uuid('lead_id')
      .references(() => leads.id, { onDelete: 'cascade' })
      .notNull(),
    authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    /** Optional voice-to-note recording url. */
    voiceUrl: text('voice_url'),
    ...timestamps(),
  },
  (t) => ({
    leadIdx: index('lead_notes_lead_idx').on(t.leadId, t.createdAt.desc()),
  }),
);
