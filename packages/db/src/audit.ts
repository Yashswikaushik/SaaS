import { createHash } from 'node:crypto';
import { db } from './client';
import { auditLog } from './schema';

export interface AuditEvent {
  actorUserId?: string | null;
  actorService?: string;
  action: string;
  target: string;
  payload?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/** Write an immutable audit event. Hashes IP — never persists raw. */
export async function audit(evt: AuditEvent): Promise<void> {
  await db.insert(auditLog).values({
    actorUserId: evt.actorUserId ?? null,
    actorService: evt.actorService ?? null,
    action: evt.action,
    target: evt.target,
    payload: evt.payload ?? null,
    ipHash: evt.ip ? hashIp(evt.ip) : null,
    userAgent: evt.userAgent ?? null,
  });
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'bharat-leads-default-salt';
  return createHash('sha256').update(salt).update(ip).digest('hex');
}
