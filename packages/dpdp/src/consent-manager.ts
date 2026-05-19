import { and, desc, eq } from 'drizzle-orm';
import { audit, consents, db, hashIp, type Database } from '@bharat/db';
import { DpdpConsentMissingError } from './errors';
import { CURRENT_NOTICE_VERSION, type ConsentScope } from './scopes';

export interface ConsentSnapshot {
  scope: ConsentScope;
  granted: boolean;
  grantedAt: string;
  noticeVersion: string;
}

export interface RecordConsentInput {
  userId: string;
  scope: ConsentScope;
  granted: boolean;
  ip: string;
  userAgent: string;
  source: string;
  noticeVersion?: string;
  /** Use a transaction instance if calling from inside a tx. */
  client?: Database;
}

/** Insert a new consent row. Never updates — history is preserved. */
export async function recordConsent(input: RecordConsentInput): Promise<void> {
  const client = input.client ?? db;
  await client.insert(consents).values({
    userId: input.userId,
    scope: input.scope,
    granted: input.granted,
    grantedAt: new Date(),
    ipHash: hashIp(input.ip),
    userAgent: input.userAgent.slice(0, 1024),
    noticeVersion: input.noticeVersion ?? CURRENT_NOTICE_VERSION,
    source: input.source,
  });

  await audit({
    actorUserId: input.userId,
    action: 'consent.record',
    target: `user:${input.userId}`,
    payload: {
      scope: input.scope,
      granted: input.granted,
      source: input.source,
      noticeVersion: input.noticeVersion ?? CURRENT_NOTICE_VERSION,
    },
    ip: input.ip,
    userAgent: input.userAgent,
  });
}

/** Latest consent record per (user, scope). Null if none ever recorded. */
export async function getLatestConsent(
  userId: string,
  scope: ConsentScope,
): Promise<ConsentSnapshot | null> {
  const rows = await db
    .select({
      scope: consents.scope,
      granted: consents.granted,
      grantedAt: consents.grantedAt,
      noticeVersion: consents.noticeVersion,
    })
    .from(consents)
    .where(and(eq(consents.userId, userId), eq(consents.scope, scope)))
    .orderBy(desc(consents.grantedAt))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    scope: row.scope as ConsentScope,
    granted: row.granted,
    grantedAt: row.grantedAt.toISOString(),
    noticeVersion: row.noticeVersion,
  };
}

/**
 * Throw if user has not consented to scope. Returns snapshot when valid.
 * Cache-on-warm: callers should pass the snapshot into outgoing message rows
 * (`consent_snapshot` JSONB) as the DPDP audit-of-record at send time.
 */
export async function assertConsent(args: {
  userId: string;
  scope: ConsentScope;
}): Promise<ConsentSnapshot> {
  const snap = await getLatestConsent(args.userId, args.scope);
  if (!snap || !snap.granted) {
    throw new DpdpConsentMissingError(args.scope, args.userId);
  }
  return snap;
}
