import { z } from 'zod';

const moneyPaise = z.number().int().nonnegative();

export const WebhookEnvelope = z.object({
  event: z.string(),
  account_id: z.string().optional(),
  contains: z.array(z.string()).default([]),
  payload: z.record(z.unknown()),
  created_at: z.number().int().optional(),
});
export type WebhookEnvelope = z.infer<typeof WebhookEnvelope>;

export const SubscriptionEntity = z.object({
  id: z.string(),
  plan_id: z.string(),
  customer_id: z.string().optional(),
  status: z.string(),
  current_start: z.number().int().nullable().optional(),
  current_end: z.number().int().nullable().optional(),
  charge_at: z.number().int().nullable().optional(),
  notes: z.record(z.string()).optional().default({}),
});

export const PaymentEntity = z.object({
  id: z.string(),
  amount: moneyPaise,
  currency: z.literal('INR'),
  status: z.string(),
  method: z.string().optional(),
  order_id: z.string().nullable().optional(),
  subscription_id: z.string().nullable().optional(),
  invoice_id: z.string().nullable().optional(),
  email: z.string().optional(),
  contact: z.string().optional(),
  notes: z.record(z.string()).optional().default({}),
  captured: z.boolean().optional(),
  created_at: z.number().int().optional(),
});

export const RefundEntity = z.object({
  id: z.string(),
  amount: moneyPaise,
  currency: z.literal('INR'),
  payment_id: z.string(),
  status: z.string(),
  notes: z.record(z.string()).optional().default({}),
});

export const SUPPORTED_EVENTS = [
  'subscription.authenticated',
  'subscription.activated',
  'subscription.charged',
  'subscription.completed',
  'subscription.updated',
  'subscription.pending',
  'subscription.halted',
  'subscription.cancelled',
  'subscription.paused',
  'subscription.resumed',
  'payment.authorized',
  'payment.captured',
  'payment.failed',
  'refund.created',
  'refund.processed',
  'refund.failed',
] as const;
export type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];

export function isSupportedEvent(name: string): name is SupportedEvent {
  return (SUPPORTED_EVENTS as readonly string[]).includes(name);
}
