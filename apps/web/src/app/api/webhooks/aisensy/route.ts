import { NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  AiSensyInbound,
  extractInboundSender,
  extractInboundText,
  sendTemplate,
  verifyAiSensyBearer,
} from '@bharat/aisensy';
import { audit, consents, db, leadMessages, users } from '@bharat/db';
import { isOptOutMessage, recordConsent } from '@bharat/dpdp';
import { env } from '@/env';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<NextResponse> {
  if (!verifyAiSensyBearer(req.headers.get('authorization'), env().AISENSY_WEBHOOK_TOKEN)) {
    return new NextResponse('unauthorized', { status: 401 });
  }

  let payload: ReturnType<typeof AiSensyInbound.parse>;
  try {
    payload = AiSensyInbound.parse(await req.json());
  } catch {
    return new NextResponse('bad payload', { status: 400 });
  }

  try {
    if (payload.status && payload.messageId) {
      await handleStatus(payload);
      return NextResponse.json({ ok: true });
    }

    const sender = extractInboundSender(payload);
    const text = extractInboundText(payload);
    if (!sender || !text) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (isOptOutMessage(text)) {
      await handleOptOut(sender);
    }
  } catch (err) {
    log.error('AiSensy webhook failed', { err: (err as Error).message });
    return new NextResponse('internal error', { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handleStatus(p: ReturnType<typeof AiSensyInbound.parse>): Promise<void> {
  if (!p.messageId || !p.status) return;
  const map: Record<string, 'sent' | 'delivered' | 'read' | 'failed'> = {
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
    rejected: 'failed',
  };
  const status = map[p.status.toLowerCase()];
  if (!status) return;

  const stamp = new Date();
  await db
    .update(leadMessages)
    .set({
      status,
      ...(status === 'delivered' && { deliveredAt: stamp }),
      ...(status === 'read' && { readAt: stamp }),
      updatedAt: stamp,
    })
    .where(eq(leadMessages.providerMessageId, p.messageId));
}

async function handleOptOut(senderPhone: string): Promise<void> {
  const user = (
    await db.select().from(users).where(eq(users.phone, senderPhone)).limit(1)
  )[0];

  if (user) {
    await recordConsent({
      userId: user.id,
      scope: 'marketing',
      granted: false,
      ip: '0.0.0.0',
      userAgent: 'aisensy-inbound',
      source: 'optout_whatsapp',
    });
  } else {
    // Phone is a lead's phone, not a registered user. Flag any matching leadMessages.
    await db
      .update(leadMessages)
      .set({ status: 'opted_out', updatedAt: new Date() })
      .where(and(eq(leadMessages.toAddress, senderPhone), eq(leadMessages.channel, 'whatsapp')));
  }

  await audit({
    actorService: 'aisensy-inbound',
    action: 'consent.optout',
    target: senderPhone,
    payload: { scope: 'marketing', via: 'whatsapp' },
  });

  try {
    await sendTemplate({
      to: senderPhone,
      campaignName: 'optout_confirmation',
      variables: [],
    });
  } catch (err) {
    log.warn('opt-out confirmation send failed', { err: (err as Error).message });
  }
}
