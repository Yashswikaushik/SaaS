import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyPaymentSignature, verifyWebhookSignature } from './signature';

const secret = 'whsec_test_xxxxxxxxxxxxxxxx';

function sign(body: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

describe('verifyWebhookSignature', () => {
  it('accepts a valid signature', () => {
    const body = '{"event":"subscription.charged"}';
    expect(verifyWebhookSignature(body, sign(body), secret)).toBe(true);
  });

  it('rejects a tampered body', () => {
    const body = '{"event":"subscription.charged"}';
    expect(verifyWebhookSignature('{"event":"refund.processed"}', sign(body), secret)).toBe(false);
  });

  it('rejects empty inputs', () => {
    expect(verifyWebhookSignature('', sign('x'), secret)).toBe(false);
    expect(verifyWebhookSignature('x', '', secret)).toBe(false);
    expect(verifyWebhookSignature('x', sign('x'), '')).toBe(false);
  });

  it('rejects different-length signatures without throwing', () => {
    expect(verifyWebhookSignature('x', 'deadbeef', secret)).toBe(false);
  });
});

describe('verifyPaymentSignature', () => {
  it('accepts a valid order/payment combo', () => {
    const orderId = 'order_123';
    const paymentId = 'pay_456';
    const sig = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    expect(verifyPaymentSignature({ orderId, paymentId, signature: sig, secret })).toBe(true);
  });

  it('rejects mismatched payment id', () => {
    const orderId = 'order_123';
    const sig = createHmac('sha256', secret).update(`${orderId}|pay_x`).digest('hex');
    expect(verifyPaymentSignature({ orderId, paymentId: 'pay_y', signature: sig, secret })).toBe(false);
  });
});
