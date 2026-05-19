import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from './client';
import {
  auditLog,
  consents,
  dsrRequests,
  leadMessages,
  leads,
  orgMembers,
  orgs,
  users,
} from './schema';

/**
 * Data Subject Rights helpers — DPDP-compliant export/erase/correct.
 * Every PII table touched here. Update this file whenever a new PII table is added.
 */

export interface DataExport {
  user: unknown;
  orgs: unknown[];
  memberships: unknown[];
  leads: unknown[];
  messages: unknown[];
  consents: unknown[];
  generatedAt: string;
}

/** Return all data we hold for a Data Principal. Run inside a tx for consistency. */
export async function exportDataPrincipal(userId: string): Promise<DataExport> {
  const [user, memberships, ownedOrgs, leadsOwned, msgs, consentRows] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(orgMembers).where(eq(orgMembers.userId, userId)),
    db.select().from(orgs).where(eq(orgs.ownerUserId, userId)),
    db.select().from(leads).where(eq(leads.ownerUserId, userId)),
    db.select().from(leadMessages).where(eq(leadMessages.senderUserId, userId)),
    db.select().from(consents).where(eq(consents.userId, userId)),
  ]);

  return {
    user: user[0] ?? null,
    orgs: ownedOrgs,
    memberships,
    leads: leadsOwned,
    messages: msgs,
    consents: consentRows,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Soft-erase a Data Principal. Hard purge scheduled 30 days later via worker.
 * Invoices and audit logs are masked, not deleted (GST 7-year retention + audit need).
 */
export async function eraseDataPrincipal(userId: string, requestId: string): Promise<void> {
  const purgeAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    const now = new Date();
    await tx.update(users).set({ deletedAt: now, isSuspended: true }).where(eq(users.id, userId));
    await tx.update(leads).set({ deletedAt: now }).where(eq(leads.ownerUserId, userId));
    await tx
      .update(leadMessages)
      .set({ deletedAt: now })
      .where(eq(leadMessages.senderUserId, userId));
    await tx
      .update(orgMembers)
      .set({ deletedAt: now, revokedAt: now })
      .where(eq(orgMembers.userId, userId));
    await tx.update(dsrRequests).set({ purgeAt }).where(eq(dsrRequests.id, requestId));

    await tx.insert(auditLog).values({
      actorUserId: userId,
      action: 'dpdp.erase.scheduled',
      target: `user:${userId}`,
      payload: { purgeAt: purgeAt.toISOString(), requestId },
    });
  });
}

/** Hard purge — called by worker on/after purgeAt. */
export async function hardPurgeDataPrincipal(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Wipe PII fields but keep row references for FK + audit integrity.
    await tx
      .update(users)
      .set({
        email: sql`'redacted-' || ${users.id} || '@purged.invalid'`,
        phone: null,
        fullName: 'PURGED',
        mfaSecretEncrypted: null,
      })
      .where(eq(users.id, userId));

    await tx
      .update(leads)
      .set({
        businessName: 'PURGED',
        contact: sql`'{}'::jsonb`,
        reviews: null,
        aiReviewSummary: null,
        addressFormatted: null,
        sourceUrl: 'purged://',
      })
      .where(eq(leads.ownerUserId, userId));

    await tx
      .update(leadMessages)
      .set({ body: 'PURGED', subject: null, toAddress: 'purged@purged.invalid' })
      .where(eq(leadMessages.senderUserId, userId));

    await tx.insert(auditLog).values({
      actorService: 'dsr-purger',
      action: 'dpdp.erase.completed',
      target: `user:${userId}`,
    });
  });
}

/** Apply a correction to specified fields with audit. */
export async function correctDataPrincipal(
  userId: string,
  patch: Partial<{ fullName: string; phone: string; email: string }>,
): Promise<void> {
  await db.transaction(async (tx) => {
    const before = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    await tx.update(users).set({ ...patch, updatedAt: new Date() }).where(eq(users.id, userId));
    await tx.insert(auditLog).values({
      actorUserId: userId,
      action: 'dpdp.correct',
      target: `user:${userId}`,
      payload: { before: before[0], patch },
    });
  });
}

/** Find DSR requests due for purge. Worker calls this on a cron. */
export async function pendingPurges(): Promise<{ id: string; userId: string }[]> {
  const due = await db
    .select({ id: dsrRequests.id, userId: dsrRequests.userId })
    .from(dsrRequests)
    .where(and(eq(dsrRequests.kind, 'erase'), isNull(dsrRequests.completedAt), sql`${dsrRequests.purgeAt} <= now()`));
  return due;
}
