---
name: razorpay-integration
description: Razorpay Subscriptions + webhook + idempotency patterns. Use when adding a plan, building a checkout, handling a webhook event, or processing a refund. Trigger on mentions of Razorpay, UPI Autopay, e-mandate, subscription, recurring payment.
---

# Razorpay integration patterns

## Plans
- All plans live in Razorpay dashboard or created via `packages/razorpay/src/plans.ts`.
- Pricing is in **paise** (integer). ₹999 = `99900` paise.
- Currency always `INR`. Plan `period`: `monthly` or `yearly`. Interval: `1`.
- Store plan IDs in env (`RAZORPAY_PLAN_<TIER>_<CYCLE>`).

## Subscription creation
```ts
import { razorpay } from '@bharat/razorpay';

const sub = await razorpay.subscriptions.create({
  plan_id: env.RAZORPAY_PLAN_STARTER_MONTHLY,
  customer_notify: 1,
  total_count: 12, // 12 cycles = 1 year, then auto-renew via new sub
  notes: { org_id: orgId, plan: 'starter' },
});
// Persist sub.id → orgs.razorpay_subscription_id BEFORE responding to user
```

Use UPI Autopay (₹1 mandate auth): set `auth_attempts: 1` on the customer.

## Webhook handler skeleton
```ts
// apps/web/app/api/webhooks/razorpay/route.ts
import { verifySignature, withIdempotency } from '@bharat/razorpay';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('x-razorpay-signature')!;
  if (!verifySignature(body, sig, env.RAZORPAY_WEBHOOK_SECRET)) {
    return new Response('bad sig', { status: 400 });
  }
  const event = JSON.parse(body);
  await withIdempotency(event.id, () => dispatchEvent(event));
  return new Response('ok');
}
```

## Events to handle
- `subscription.authenticated` — mandate set, no money yet → mark org `pending_first_charge`
- `subscription.charged` — money in → generate invoice, mark org `active`
- `subscription.payment_failed` → enqueue dunning job, in-app banner
- `subscription.halted` → suspend org access (read-only)
- `payment.captured` (one-time) → invoice
- `refund.processed` → credit-note invoice

## Idempotency
- Dedup key: `razorpay_event_id`
- Store in `razorpay_processed_events` table (event_id PK, processed_at)
- Inside transaction: `INSERT … ON CONFLICT DO NOTHING RETURNING *`. If no row returned → already processed → 200 OK without re-running.

## Founder safety
On any charge ≥ ₹4,999, post to `EMAIL_FROM` with subject `[ALERT] Razorpay charge ₹X to <org>`.

## Test mode
- Use `rzp_test_...` keys
- Trigger events via Razorpay dashboard's "Test webhook" feature or our local `tools/mcp-razorpay/simulate.ts`
