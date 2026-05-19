import { razorpayClient } from './client';
import { razorpayPlanIdFor, type PlanPricing } from './plans';

export interface CreateSubscriptionInput {
  tier: PlanPricing['tier'];
  cycle: 'monthly' | 'yearly';
  /** Total billing cycles. Razorpay caps at 1000. We default to 12 monthly / 1 yearly. */
  totalCount?: number;
  orgId: string;
  /** Customer notes for traceability — surfaced in Razorpay dashboard. */
  notes?: Record<string, string>;
  /** ₹1 mandate auth — proven to lift UPI Autopay success. */
  customerNotify?: boolean;
}

export interface CreatedSubscription {
  id: string;
  status: string;
  shortUrl?: string;
  notes: Record<string, string>;
  planId: string;
  amountPaise: number;
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<CreatedSubscription> {
  const planId = razorpayPlanIdFor(input.tier, input.cycle);
  const totalCount = input.totalCount ?? (input.cycle === 'monthly' ? 12 : 1);

  const sub = (await razorpayClient().subscriptions.create({
    plan_id: planId,
    customer_notify: input.customerNotify === false ? 0 : 1,
    total_count: totalCount,
    notes: {
      org_id: input.orgId,
      tier: input.tier,
      cycle: input.cycle,
      ...(input.notes ?? {}),
    },
  })) as unknown as {
    id: string;
    status: string;
    short_url?: string;
    notes: Record<string, string>;
    plan_id: string;
  };

  return {
    id: sub.id,
    status: sub.status,
    shortUrl: sub.short_url,
    notes: sub.notes,
    planId: sub.plan_id,
    amountPaise: 0,
  };
}

export async function cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean): Promise<void> {
  await razorpayClient().subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
}

export async function pauseSubscription(subscriptionId: string): Promise<void> {
  await razorpayClient().subscriptions.pause(subscriptionId, { pause_at: 'now' });
}

export async function resumeSubscription(subscriptionId: string): Promise<void> {
  await razorpayClient().subscriptions.resume(subscriptionId, { resume_at: 'now' });
}

export async function fetchSubscription(subscriptionId: string): Promise<unknown> {
  return razorpayClient().subscriptions.fetch(subscriptionId);
}
