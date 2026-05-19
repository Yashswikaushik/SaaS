import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { audit, db, invoices, orgs, subscriptions } from '@bharat/db';
import {
  PLAN_PRICING,
  WebhookEnvelope,
  isSupportedEvent,
  verifyWebhookSignature,
  withIdempotency,
  type SupportedEvent,
} from '@bharat/razorpay';
import { allocateInvoiceNumber, calculateTax, getFiscalYear, stateCodeFromGstin } from '@bharat/gst';
import { env } from '@/env';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<NextResponse> {
  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature') ?? '';

  if (!verifyWebhookSignature(raw, sig, env().RAZORPAY_WEBHOOK_SECRET)) {
    log.warn('Razorpay webhook bad signature', { len: raw.length });
    return new NextResponse('Invalid signature', { status: 400 });
  }

  let envelope: ReturnType<typeof WebhookEnvelope.parse>;
  try {
    envelope = WebhookEnvelope.parse(JSON.parse(raw));
  } catch {
    return new NextResponse('Invalid payload', { status: 400 });
  }

  const eventName = envelope.event;
  if (!isSupportedEvent(eventName)) {
    log.info('Razorpay unsupported event', { event: eventName });
    return NextResponse.json({ ok: true, skipped: true });
  }

  const eventId = (req.headers.get('x-razorpay-event-id') ?? envelope.payload?.payment?.entity?.id ?? '') as string;
  if (!eventId) {
    log.warn('Razorpay webhook missing event id');
    return new NextResponse('Missing event id', { status: 400 });
  }

  try {
    const { processed } = await withIdempotency(eventId, raw, () => dispatch(eventName, envelope));
    return NextResponse.json({ ok: true, processed });
  } catch (err) {
    log.error('Razorpay webhook handler failed', { event: eventName, eventId, err: (err as Error).message });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

async function dispatch(event: SupportedEvent, env: ReturnType<typeof WebhookEnvelope.parse>): Promise<void> {
  switch (event) {
    case 'subscription.authenticated':
      return handleSubscriptionAuthenticated(env);
    case 'subscription.activated':
    case 'subscription.charged':
      return handleSubscriptionCharged(env);
    case 'subscription.halted':
    case 'subscription.paused':
      return handleSubscriptionHalted(env);
    case 'subscription.cancelled':
    case 'subscription.completed':
      return handleSubscriptionCancelled(env);
    case 'payment.failed':
      return handlePaymentFailed(env);
    case 'refund.processed':
      return handleRefund(env);
    default:
      log.info('Unhandled Razorpay event', { event });
  }
}

async function handleSubscriptionAuthenticated(envObj: ReturnType<typeof WebhookEnvelope.parse>): Promise<void> {
  const sub = envObj.payload.subscription?.entity as
    | { id: string; status: string; current_start?: number; current_end?: number; charge_at?: number }
    | undefined;
  if (!sub) return;
  await db
    .update(subscriptions)
    .set({
      status: sub.status,
      currentStart: sub.current_start ? new Date(sub.current_start * 1000) : null,
      currentEnd: sub.current_end ? new Date(sub.current_end * 1000) : null,
      chargeAt: sub.charge_at ? new Date(sub.charge_at * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.razorpaySubscriptionId, sub.id));

  const subRow = (
    await db.select().from(subscriptions).where(eq(subscriptions.razorpaySubscriptionId, sub.id)).limit(1)
  )[0];
  if (subRow) {
    await db
      .update(orgs)
      .set({ planStatus: 'pending_first_charge', updatedAt: new Date() })
      .where(eq(orgs.id, subRow.orgId));
  }
}

async function handleSubscriptionCharged(envObj: ReturnType<typeof WebhookEnvelope.parse>): Promise<void> {
  const sub = envObj.payload.subscription?.entity as { id: string; status: string } | undefined;
  const payment = envObj.payload.payment?.entity as
    | { id: string; amount: number; status: string }
    | undefined;
  if (!sub || !payment) return;

  const subRow = (
    await db.select().from(subscriptions).where(eq(subscriptions.razorpaySubscriptionId, sub.id)).limit(1)
  )[0];
  if (!subRow) {
    log.warn('Charge for unknown subscription', { subId: sub.id });
    return;
  }
  const orgRow = (await db.select().from(orgs).where(eq(orgs.id, subRow.orgId)).limit(1))[0];
  if (!orgRow) return;

  const pricing = PLAN_PRICING[subRow.plan as keyof typeof PLAN_PRICING];

  await db
    .update(subscriptions)
    .set({ status: sub.status, updatedAt: new Date() })
    .where(eq(subscriptions.id, subRow.id));

  await db
    .update(orgs)
    .set({
      plan: subRow.plan,
      planStatus: 'active',
      leadCap: pricing.leadCap,
      monthlyRenewalCap: pricing.monthlyRenewalCap,
      seatCap: pricing.seatCap,
      aiEmailsPerLead: pricing.aiEmailsPerLead === Number.MAX_SAFE_INTEGER ? 9999 : pricing.aiEmailsPerLead,
      reviewsPerLead: pricing.reviewsPerLead,
      waMessagesPerMonth: pricing.waMessagesPerMonth,
      routesEnabled: pricing.routesEnabled,
      aiAssistantEnabled: pricing.aiAssistantEnabled,
      whiteLabelEnabled: pricing.whiteLabelEnabled,
      razorpaySubscriptionId: sub.id,
      updatedAt: new Date(),
    })
    .where(eq(orgs.id, orgRow.id));

  // Generate GST invoice
  const customerStateCode =
    (orgRow.gstin ? stateCodeFromGstin(orgRow.gstin) : null) ?? orgRow.billingStateCode;
  const supplierStateCode = process.env.ORG_BILLING_STATE_CODE ?? '29';
  const tax = calculateTax({
    taxableAmountPaise: Math.floor(payment.amount / 1.18),
    customerStateCode,
    supplierStateCode,
  });
  const fy = getFiscalYear(new Date());
  const invoiceNo = await allocateInvoiceNumber(db, fy);

  await db.insert(invoices).values({
    orgId: orgRow.id,
    subscriptionId: subRow.id,
    invoiceNo,
    fiscalYear: fy,
    issuedAt: new Date(),
    supplier: {
      name: 'Bharat Leads (Yashswi Tech)',
      gstin: process.env.SUPPLIER_GSTIN ?? '29AAAAA0000A1Z5',
      address: 'Bengaluru, Karnataka',
      stateCode: supplierStateCode,
      pan: process.env.SUPPLIER_PAN ?? 'AAAAA0000A',
    },
    recipient: {
      name: orgRow.name,
      legalName: orgRow.legalName ?? undefined,
      gstin: orgRow.gstin,
      address:
        [orgRow.billingAddressLine1, orgRow.billingAddressLine2, orgRow.billingCity, orgRow.billingPincode]
          .filter(Boolean)
          .join(', ') || 'India',
      stateCode: customerStateCode,
    },
    placeOfSupplyCode: customerStateCode,
    hsnSac: orgRow.hsnSac,
    description: `Bharat Leads ${subRow.plan} subscription`,
    taxableAmountPaise: tax.taxableAmountPaise,
    cgstPaise: tax.cgstPaise,
    sgstPaise: tax.sgstPaise,
    igstPaise: tax.igstPaise,
    totalPaise: tax.totalPaise,
    status: 'paid',
    razorpayPaymentId: payment.id,
  });

  await audit({
    actorService: 'razorpay-webhook',
    action: 'billing.invoice.issued',
    target: `org:${orgRow.id}`,
    payload: { invoiceNo, amountPaise: payment.amount, paymentId: payment.id },
  });

  if (payment.amount >= 4_999_00) {
    log.warn('Large charge detected — founder alert pending', {
      orgId: orgRow.id,
      paymentId: payment.id,
      amount: payment.amount,
    });
  }
}

async function handleSubscriptionHalted(envObj: ReturnType<typeof WebhookEnvelope.parse>): Promise<void> {
  const sub = envObj.payload.subscription?.entity as { id: string; status: string } | undefined;
  if (!sub) return;
  await db
    .update(subscriptions)
    .set({ status: sub.status, updatedAt: new Date() })
    .where(eq(subscriptions.razorpaySubscriptionId, sub.id));

  const subRow = (
    await db.select().from(subscriptions).where(eq(subscriptions.razorpaySubscriptionId, sub.id)).limit(1)
  )[0];
  if (subRow) {
    await db
      .update(orgs)
      .set({ planStatus: 'paused', updatedAt: new Date() })
      .where(eq(orgs.id, subRow.orgId));
  }
}

async function handleSubscriptionCancelled(envObj: ReturnType<typeof WebhookEnvelope.parse>): Promise<void> {
  const sub = envObj.payload.subscription?.entity as { id: string } | undefined;
  if (!sub) return;
  await db
    .update(subscriptions)
    .set({ cancelledAt: new Date(), status: 'cancelled', updatedAt: new Date() })
    .where(eq(subscriptions.razorpaySubscriptionId, sub.id));

  const subRow = (
    await db.select().from(subscriptions).where(eq(subscriptions.razorpaySubscriptionId, sub.id)).limit(1)
  )[0];
  if (subRow) {
    await db
      .update(orgs)
      .set({ planStatus: 'cancelled', plan: 'free', updatedAt: new Date() })
      .where(eq(orgs.id, subRow.orgId));
  }
}

async function handlePaymentFailed(envObj: ReturnType<typeof WebhookEnvelope.parse>): Promise<void> {
  const sub = envObj.payload.subscription?.entity as { id: string } | undefined;
  if (!sub) return;
  const subRow = (
    await db.select().from(subscriptions).where(eq(subscriptions.razorpaySubscriptionId, sub.id)).limit(1)
  )[0];
  if (subRow) {
    await db
      .update(orgs)
      .set({ planStatus: 'past_due', updatedAt: new Date() })
      .where(eq(orgs.id, subRow.orgId));
    await audit({
      actorService: 'razorpay-webhook',
      action: 'billing.payment.failed',
      target: `org:${subRow.orgId}`,
    });
  }
}

async function handleRefund(envObj: ReturnType<typeof WebhookEnvelope.parse>): Promise<void> {
  const refund = envObj.payload.refund?.entity as { id: string; payment_id: string; amount: number } | undefined;
  if (!refund) return;
  await db
    .update(invoices)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(and(eq(invoices.razorpayPaymentId, refund.payment_id)));
  await audit({
    actorService: 'razorpay-webhook',
    action: 'billing.refund.processed',
    target: `payment:${refund.payment_id}`,
    payload: { refundId: refund.id, amount: refund.amount },
  });
}
