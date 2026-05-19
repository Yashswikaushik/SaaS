import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { audit, db, users } from '@bharat/db';
import { supabaseServer } from '@/lib/supabase-server';
import { recordConsent } from '@bharat/dpdp';

export const runtime = 'nodejs';

/**
 * Supabase Auth callback. Handles magic-link / OTP confirmations.
 * On first successful auth, provisions a `users` row + records essential
 * consent. Idempotent on `auth_id`.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/app';
  if (!code) return NextResponse.redirect(new URL('/login', req.url));

  const sb = supabaseServer();
  const { data, error } = await sb.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=invalid', req.url));
  }

  const authId = data.user.id;
  const email = data.user.email ?? '';
  const phone = data.user.phone ?? null;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
  const ua = req.headers.get('user-agent') ?? '';

  const existing = (
    await db.select({ id: users.id }).from(users).where(eq(users.authId, authId)).limit(1)
  )[0];

  let userId = existing?.id;
  if (!userId) {
    const created = await db
      .insert(users)
      .values({
        authId,
        email,
        phone: phone ? (phone.startsWith('+') ? phone : `+${phone}`) : null,
        emailVerifiedAt: data.user.email_confirmed_at ?? null,
        phoneVerifiedAt: data.user.phone_confirmed_at ?? null,
      })
      .returning({ id: users.id });
    userId = created[0]?.id;
    if (userId) {
      await recordConsent({
        userId,
        scope: 'essential',
        granted: true,
        ip,
        userAgent: ua,
        source: 'signup',
      });
      await audit({
        actorUserId: userId,
        action: 'user.provisioned',
        target: `user:${userId}`,
        ip,
        userAgent: ua,
      });
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}
