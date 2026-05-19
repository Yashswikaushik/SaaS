import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { db, hashIp, otpCodes } from '@bharat/db';

/**
 * Server-side OTP store. Codes are HMAC-hashed at rest with `OTP_HMAC_SECRET`.
 * Plain codes are visible only at issue-time, returned to the caller for delivery.
 */

function hmacSecret(): string {
  const s = process.env.OTP_HMAC_SECRET;
  if (!s) throw new Error('OTP_HMAC_SECRET env var is required');
  return s;
}

function hashCode(code: string): string {
  return createHmac('sha256', hmacSecret()).update(code).digest('hex');
}

export function generateNumericCode(digits = 6): string {
  if (digits < 4 || digits > 10) throw new Error('digits must be 4-10');
  const max = 10 ** digits;
  const n = randomInt(0, max);
  return String(n).padStart(digits, '0');
}

export interface IssueOtpInput {
  identity: string;
  channel: 'email' | 'sms' | 'whatsapp';
  purpose: 'login' | 'signup' | 'verify_phone' | 'verify_email';
  ip: string;
  ttlMinutes?: number;
  maxAttempts?: number;
  digits?: number;
  /** Optional provider request id from MSG91/AiSensy. */
  providerRequestId?: string;
}

export async function issueOtp(input: IssueOtpInput): Promise<{ id: string; code: string }> {
  const code = generateNumericCode(input.digits ?? 6);
  const expiresAt = new Date(Date.now() + (input.ttlMinutes ?? 10) * 60 * 1000);
  const rows = await db
    .insert(otpCodes)
    .values({
      identity: input.identity.toLowerCase(),
      channel: input.channel,
      purpose: input.purpose,
      codeHash: hashCode(code),
      maxAttempts: input.maxAttempts ?? 5,
      expiresAt,
      providerRequestId: input.providerRequestId,
      ipHash: hashIp(input.ip),
    })
    .returning({ id: otpCodes.id });
  if (!rows[0]) throw new Error('Failed to issue OTP');
  return { id: rows[0].id, code };
}

export interface VerifyOtpInput {
  identity: string;
  code: string;
  channel: 'email' | 'sms' | 'whatsapp';
  purpose: 'login' | 'signup' | 'verify_phone' | 'verify_email';
}

export async function verifyOtp(input: VerifyOtpInput): Promise<boolean> {
  const now = new Date();
  const candidates = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.identity, input.identity.toLowerCase()),
        eq(otpCodes.channel, input.channel),
        eq(otpCodes.purpose, input.purpose),
        isNull(otpCodes.consumedAt),
        gt(otpCodes.expiresAt, now),
      ),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  const row = candidates[0];
  if (!row) return false;

  if (row.attempt >= row.maxAttempts) return false;

  const expected = Buffer.from(row.codeHash, 'hex');
  const got = Buffer.from(hashCode(input.code), 'hex');
  const ok = expected.length === got.length && timingSafeEqual(expected, got);

  if (ok) {
    await db
      .update(otpCodes)
      .set({ consumedAt: now })
      .where(eq(otpCodes.id, row.id));
    return true;
  }

  await db
    .update(otpCodes)
    .set({ attempt: sql`${otpCodes.attempt} + 1` })
    .where(eq(otpCodes.id, row.id));
  return false;
}
