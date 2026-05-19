import { sql } from 'drizzle-orm';
import {
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
import { users } from './users';

export const consentScopeEnum = pgEnum('consent_scope', [
  'essential',
  'marketing',
  'analytics',
  'ai_processing',
]);

export const consents = pgTable(
  'consents',
  {
    id: pk(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    scope: consentScopeEnum('scope').notNull(),
    granted: boolean('granted').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull(),
    /** Hashed IP — never raw, DPDP minimisation. */
    ipHash: varchar('ip_hash', { length: 64 }).notNull(),
    userAgent: text('user_agent').notNull(),
    noticeVersion: varchar('notice_version', { length: 16 }).notNull(),
    /** Reason for change — 'banner', 'settings', 'optout_sms', etc. */
    source: text('source').notNull(),
    ...timestamps(),
  },
  (t) => ({
    userScopeIdx: index('consents_user_scope_idx').on(t.userId, t.scope, t.grantedAt.desc()),
  }),
);

export const legalNotices = pgTable(
  'legal_notices',
  {
    id: pk(),
    kind: text('kind').notNull(), // privacy | terms | dpa | cookie | grievance
    version: varchar('version', { length: 16 }).notNull(),
    locale: text('locale').notNull(),
    body: text('body').notNull(),
    effectiveAt: timestamp('effective_at', { withTimezone: true }).notNull(),
    ...timestamps(),
  },
  (t) => ({
    kindVersionLocaleUq: uniqueIndex('legal_notices_kind_version_locale_uq').on(t.kind, t.version, t.locale),
  }),
);

export const dsrRequestKindEnum = pgEnum('dsr_kind', ['export', 'erase', 'correct']);
export const dsrStatusEnum = pgEnum('dsr_status', ['pending', 'in_progress', 'completed', 'rejected']);

export const dsrRequests = pgTable(
  'dsr_requests',
  {
    id: pk(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    kind: dsrRequestKindEnum('kind').notNull(),
    status: dsrStatusEnum('status').notNull().default('pending'),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    /** Set when erase request enters cooling-off; hard purge at this time. */
    purgeAt: timestamp('purge_at', { withTimezone: true }),
    /** Signed URL of export ZIP. */
    artifactUrl: text('artifact_url'),
    rejectionReason: text('rejection_reason'),
    ...timestamps(),
  },
  (t) => ({
    userIdx: index('dsr_requests_user_idx').on(t.userId, t.createdAt.desc()),
    purgeIdx: index('dsr_requests_purge_idx').on(t.purgeAt).where(sql`${t.purgeAt} is not null`),
  }),
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: pk(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    /** When action is system-driven, actor is null and actorService is set. */
    actorService: text('actor_service'),
    action: text('action').notNull(),
    target: text('target').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: text('user_agent'),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    actorIdx: index('audit_log_actor_idx').on(t.actorUserId, t.occurredAt.desc()),
    targetIdx: index('audit_log_target_idx').on(t.target, t.occurredAt.desc()),
    actionIdx: index('audit_log_action_idx').on(t.action, t.occurredAt.desc()),
  }),
);

export type Consent = typeof consents.$inferSelect;
export type DsrRequest = typeof dsrRequests.$inferSelect;
export type AuditLogRow = typeof auditLog.$inferSelect;
