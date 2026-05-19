import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
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
import { orgs, planEnum } from './orgs';

export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'yearly']);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: pk(),
    orgId: uuid('org_id')
      .references(() => orgs.id, { onDelete: 'cascade' })
      .notNull(),
    plan: planEnum('plan').notNull(),
    cycle: billingCycleEnum('cycle').notNull(),
    /** Razorpay subscription id. */
    razorpaySubscriptionId: text('razorpay_subscription_id').notNull(),
    razorpayPlanId: text('razorpay_plan_id').notNull(),
    razorpayCustomerId: text('razorpay_customer_id'),
    /** created | authenticated | active | pending | halted | cancelled | completed | expired. */
    status: text('status').notNull().default('created'),
    amountPaise: bigint('amount_paise', { mode: 'number' }).notNull(),
    currentStart: timestamp('current_start', { withTimezone: true }),
    currentEnd: timestamp('current_end', { withTimezone: true }),
    chargeAt: timestamp('charge_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelAtCycleEnd: boolean('cancel_at_cycle_end').notNull().default(false),
    notes: jsonb('notes').$type<Record<string, string>>(),
    ...timestamps(),
  },
  (t) => ({
    orgIdx: index('subscriptions_org_idx').on(t.orgId, t.createdAt.desc()),
    rzpSubUq: uniqueIndex('subscriptions_rzp_sub_uq').on(t.razorpaySubscriptionId),
  }),
);

export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'issued', 'paid', 'void', 'refunded']);

export const invoices = pgTable(
  'invoices',
  {
    id: pk(),
    orgId: uuid('org_id')
      .references(() => orgs.id, { onDelete: 'restrict' })
      .notNull(),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
    /** Format: BL/2025-26/00001. FY-sequential. Immutable once issued. */
    invoiceNo: text('invoice_no').notNull(),
    fiscalYear: varchar('fiscal_year', { length: 7 }).notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
    /** Snapshot of supplier (us) — never join live, audits require frozen. */
    supplier: jsonb('supplier')
      .$type<{
        name: string;
        gstin: string;
        address: string;
        stateCode: string;
        pan: string;
      }>()
      .notNull(),
    /** Snapshot of recipient. */
    recipient: jsonb('recipient')
      .$type<{
        name: string;
        gstin: string | null;
        address: string;
        stateCode: string;
        legalName?: string;
      }>()
      .notNull(),
    placeOfSupplyCode: varchar('place_of_supply_code', { length: 2 }).notNull(),
    hsnSac: varchar('hsn_sac', { length: 8 }).notNull(),
    description: text('description').notNull(),
    taxableAmountPaise: bigint('taxable_amount_paise', { mode: 'number' }).notNull(),
    cgstPaise: bigint('cgst_paise', { mode: 'number' }).notNull().default(0),
    sgstPaise: bigint('sgst_paise', { mode: 'number' }).notNull().default(0),
    igstPaise: bigint('igst_paise', { mode: 'number' }).notNull().default(0),
    cessPaise: bigint('cess_paise', { mode: 'number' }).notNull().default(0),
    totalPaise: bigint('total_paise', { mode: 'number' }).notNull(),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    /** Razorpay ids for traceability. */
    razorpayPaymentId: text('razorpay_payment_id'),
    razorpayInvoiceId: text('razorpay_invoice_id'),
    pdfUrl: text('pdf_url'),
    /** IRN (e-invoice) — set when applicable. */
    irn: text('irn'),
    irpUploadedAt: timestamp('irp_uploaded_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => ({
    invoiceNoUq: uniqueIndex('invoices_invoice_no_uq').on(t.invoiceNo),
    orgIssuedIdx: index('invoices_org_issued_idx').on(t.orgId, t.issuedAt.desc()),
    fyIdx: index('invoices_fy_idx').on(t.fiscalYear),
  }),
);

/**
 * Razorpay webhook events — dedup table. Idempotency on event id.
 * INSERT … ON CONFLICT DO NOTHING RETURNING xmax = 0 → newly inserted.
 */
export const razorpayProcessedEvents = pgTable(
  'razorpay_processed_events',
  {
    eventId: text('event_id').primaryKey(),
    eventType: text('event_type').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    payloadHash: varchar('payload_hash', { length: 64 }).notNull(),
  },
  (t) => ({
    processedIdx: index('rzp_events_processed_idx').on(t.processedAt.desc()),
  }),
);

export type Invoice = typeof invoices.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
