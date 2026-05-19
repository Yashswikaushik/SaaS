import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { sendOtp } from '@bharat/msg91';
import { env } from '@/env';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * Supabase Auth "Send SMS hook". Triggered by Supabase when a phone-OTP user
 * requests a code. Supabase signs the payload with `SUPABASE_AUTH_HOOK_SECRET`;
 * we verify and dispatch via MSG91 with DLT-approved template.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const raw = await req.text();
  const sig = req.headers.get('webhook-signature') ?? '';
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET ?? '';
  if (!verifyHookSignature(raw, sig, secret)) {
    return new NextResponse('bad sig', { status: 401 });
  }

  const body = JSON.parse(raw) as {
    user: { phone?: string };
    sms: { otp: string };
  };
  const phone = body.user.phone;
  const otp = body.sms.otp;
  if (!phone || !otp) return new NextResponse('bad payload', { status: 400 });

  try {
    await sendOtp({
      mobile: phone.replace(/^\+/, ''),
      otp,
      templateId: env().MSG91_OTP_TEMPLATE_ID,
      senderId: env().MSG91_SENDER_ID,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('Supabase SMS hook MSG91 dispatch failed', { err: (err as Error).message });
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}

function verifyHookSignature(raw: string, headerVal: string, secret: string): boolean {
  if (!headerVal || !secret) return false;
  // Supabase format: "v1,whsec_<hex>"
  const [, sig] = headerVal.split(',');
  if (!sig) return false;
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}
