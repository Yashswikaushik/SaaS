import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { pk, timestamps } from './_common';
import { userRoleEnum, users } from './users';

export const planEnum = pgEnum('plan', ['free', 'starter', 'growth', 'scale', 'agency']);

export const planStatusEnum = pgEnum('plan_status', [
  'trialing',
  'pending_first_charge',
  'active',
  'past_due',
  'paused',
  'cancelled',
]);

export const orgs = pgTable(
  'orgs',
  {
    id: pk(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    /** Two-digit state code per GST schema. KA = 29, MH = 27, etc. */
    billingStateCode: varchar('billing_state_code', { length: 2 }).notNull(),
    /** Pin code for invoice billing address. */
    billingPincode: varchar('billing_pincode', { length: 6 }),
    billingAddressLine1: text('billing_address_line1'),
    billingAddressLine2: text('billing_address_line2'),
    billingCity: text('billing_city'),
    gstin: varchar('gstin', { length: 15 }),
    legalName: text('legal_name'),
    pan: varchar('pan', { length: 10 }),
    hsnSac: varchar('hsn_sac', { length: 8 }).notNull().default('998314'),
    plan: planEnum('plan').notNull().default('free'),
    planStatus: planStatusEnum('plan_status').notNull().default('trialing'),
    /** Mirror of subscriptions table for fast hot-path reads. */
    razorpayCustomerId: text('razorpay_customer_id'),
    razorpaySubscriptionId: text('razorpay_subscription_id'),
    /** Quotas — cached from plan, overridable per-org for grandfathered customers. */
    leadCap: integer('lead_cap').notNull().default(15),
    monthlyRenewalCap: integer('monthly_renewal_cap').notNull().default(0),
    seatCap: integer('seat_cap').notNull().default(1),
    aiEmailsPerLead: integer('ai_emails_per_lead').notNull().default(1),
    reviewsPerLead: integer('reviews_per_lead').notNull().default(10),
    waMessagesPerMonth: integer('wa_messages_per_month').notNull().default(0),
    routesEnabled: boolean('routes_enabled').notNull().default(false),
    aiAssistantEnabled: boolean('ai_assistant_enabled').notNull().default(false),
    whiteLabelEnabled: boolean('white_label_enabled').notNull().default(false),
    ownerUserId: uuid('owner_user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    /** UTC timestamp at which trial ends. Null = no trial. */
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => ({
    slugUq: uniqueIndex('orgs_slug_uq').on(t.slug),
    gstinUq: uniqueIndex('orgs_gstin_uq').on(t.gstin).where(sql`${t.gstin} is not null`),
    ownerIdx: index('orgs_owner_idx').on(t.ownerUserId),
  }),
);

export const orgMembers = pgTable(
  'org_members',
  {
    id: pk(),
    orgId: uuid('org_id')
      .references(() => orgs.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: userRoleEnum('role').notNull().default('member'),
    /** GeoJSON Polygon — null means full-org scope. */
    scopePolygon: text('scope_polygon'),
    invitedByUserId: uuid('invited_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => ({
    orgUserUq: uniqueIndex('org_members_org_user_uq').on(t.orgId, t.userId),
    orgIdx: index('org_members_org_idx').on(t.orgId),
    userIdx: index('org_members_user_idx').on(t.userId),
  }),
);

export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
export type OrgMember = typeof orgMembers.$inferSelect;
