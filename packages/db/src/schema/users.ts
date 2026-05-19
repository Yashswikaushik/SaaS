import { sql } from 'drizzle-orm';
import { boolean, index, pgEnum, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { pk, timestamps } from './_common';

export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'member', 'rep']);

export const localeEnum = pgEnum('locale', ['en-IN', 'hi-IN', 'ta-IN', 'te-IN', 'mr-IN', 'bn-IN', 'kn-IN']);

export const users = pgTable(
  'users',
  {
    id: pk(),
    /** Supabase Auth user id (uuid). 1:1 with our users row. */
    authId: text('auth_id').notNull(),
    email: text('email').notNull(),
    emailVerifiedAt: text('email_verified_at'),
    /** E.164 with leading +91. Validated at the boundary. */
    phone: varchar('phone', { length: 16 }),
    phoneVerifiedAt: text('phone_verified_at'),
    fullName: text('full_name'),
    locale: localeEnum('locale').notNull().default('en-IN'),
    /** Personal GSTIN — orgs hold the billing GSTIN. */
    gstin: varchar('gstin', { length: 15 }),
    /** TOTP secret encrypted at rest with KMS key. Null = MFA disabled. */
    mfaSecretEncrypted: text('mfa_secret_encrypted'),
    isSuspended: boolean('is_suspended').notNull().default(false),
    ...timestamps(),
  },
  (t) => ({
    authIdUq: uniqueIndex('users_auth_id_uq').on(t.authId),
    emailUq: uniqueIndex('users_email_uq').on(sql`lower(${t.email})`),
    phoneUq: uniqueIndex('users_phone_uq').on(t.phone).where(sql`${t.phone} is not null`),
    createdIdx: index('users_created_idx').on(t.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
