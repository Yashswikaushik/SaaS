import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { pk, timestamps } from './_common';
import { leads } from './leads';
import { orgs } from './orgs';
import { users } from './users';

export const channelEnum = pgEnum('message_channel', ['email', 'sms', 'whatsapp', 'call']);

export const messageStatusEnum = pgEnum('message_status', [
  'queued',
  'sent',
  'delivered',
  'read',
  'failed',
  'bounced',
  'opted_out',
]);

export const leadMessages = pgTable(
  'lead_messages',
  {
    id: pk(),
    orgId: uuid('org_id')
      .references(() => orgs.id, { onDelete: 'cascade' })
      .notNull(),
    leadId: uuid('lead_id')
      .references(() => leads.id, { onDelete: 'cascade' })
      .notNull(),
    senderUserId: uuid('sender_user_id').references(() => users.id, { onDelete: 'set null' }),
    channel: channelEnum('channel').notNull(),
    direction: text('direction').notNull().default('outbound'),
    status: messageStatusEnum('status').notNull().default('queued'),
    /** Address used — email, +91…, etc. */
    toAddress: text('to_address').notNull(),
    subject: text('subject'),
    body: text('body').notNull(),
    aiGenerated: text('ai_generated'),
    /** Snapshot of consent at send time — DPDP audit trail. */
    consentSnapshot: jsonb('consent_snapshot')
      .$type<{
        scope: string;
        granted: boolean;
        granted_at?: string;
        notice_version: string;
      }>()
      .notNull(),
    /** Provider message id (Resend/SES/AiSensy). */
    providerMessageId: text('provider_message_id'),
    /** WA template name when channel = whatsapp. */
    templateName: text('template_name'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    readAt: timestamp('read_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => ({
    orgIdx: index('lead_messages_org_idx').on(t.orgId, t.createdAt.desc()),
    leadIdx: index('lead_messages_lead_idx').on(t.leadId, t.createdAt.desc()),
    providerIdx: index('lead_messages_provider_idx').on(t.providerMessageId).where(
      sql`${t.providerMessageId} is not null`,
    ),
  }),
);

export const waTemplates = pgTable(
  'wa_templates',
  {
    id: pk(),
    orgId: uuid('org_id').references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category').notNull(),
    language: text('language').notNull().default('en'),
    body: text('body').notNull(),
    /** PENDING | APPROVED | REJECTED | DELETED. */
    status: text('status').notNull().default('PENDING'),
    metaTemplateId: text('meta_template_id'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    ...timestamps(),
  },
  (t) => ({
    nameLangUq: index('wa_templates_name_lang_idx').on(t.name, t.language),
  }),
);
