import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { pk, timestamps } from './_common';

export const otpChannelEnum = pgEnum('otp_channel', ['email', 'sms', 'whatsapp']);
export const otpPurposeEnum = pgEnum('otp_purpose', ['login', 'signup', 'verify_phone', 'verify_email']);

/**
 * OTP table — codes are NEVER stored in plaintext.
 * Store HMAC-SHA256(code, secret) and verify by re-hashing.
 */
export const otpCodes = pgTable(
  'otp_codes',
  {
    id: pk(),
    /** lower(email) or +91… phone — addressed identity. */
    identity: text('identity').notNull(),
    channel: otpChannelEnum('channel').notNull(),
    purpose: otpPurposeEnum('purpose').notNull(),
    codeHash: varchar('code_hash', { length: 64 }).notNull(),
    /** Sequence number for rate-limiting/replay-detection. */
    attempt: integer('attempt').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    /** Expires after 10 minutes by default. */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    /** Provider request id for audit. */
    providerRequestId: text('provider_request_id'),
    ipHash: varchar('ip_hash', { length: 64 }).notNull(),
    ...timestamps(),
  },
  (t) => ({
    identityCreatedIdx: index('otp_identity_created_idx').on(t.identity, t.createdAt.desc()),
    expiresIdx: index('otp_expires_idx').on(t.expiresAt).where(sql`${t.consumedAt} is null`),
  }),
);

export type OtpCode = typeof otpCodes.$inferSelect;
