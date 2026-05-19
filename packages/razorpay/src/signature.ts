import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify a Razorpay webhook signature using HMAC-SHA256 with the configured webhook secret.
 * Uses timing-safe comparison to prevent timing-attack signature recovery.
 *
 * @param rawBody  Exact request body bytes/string as received (do NOT JSON.parse and re-stringify).
 * @param signature  Value of `x-razorpay-signature` header.
 * @param secret  Webhook secret configured in Razorpay dashboard.
 */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!rawBody || !signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Verify Razorpay payment signature returned to the browser handler after success.
 * sig = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
export function verifyPaymentSignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  const expected = createHmac('sha256', args.secret)
    .update(`${args.orderId}|${args.paymentId}`, 'utf8')
    .digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(args.signature, 'hex'));
  } catch {
    return false;
  }
}

/** Verify subscription payment signature: HMAC(payment_id + "|" + subscription_id, secret). */
export function verifySubscriptionSignature(args: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
  secret: string;
}): boolean {
  const expected = createHmac('sha256', args.secret)
    .update(`${args.paymentId}|${args.subscriptionId}`, 'utf8')
    .digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(args.signature, 'hex'));
  } catch {
    return false;
  }
}
