import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const AiSensyInbound = z.object({
  /** AiSensy uses several event names. */
  event: z.enum(['message_received', 'status_update', 'incoming_message']).optional(),
  /** Some payloads use `type` instead. */
  type: z.string().optional(),
  /** Phone number that sent the message (E.164 without +). */
  from: z.string().optional(),
  waId: z.string().optional(),
  /** For inbound text messages. */
  message: z
    .object({
      type: z.string().optional(),
      text: z.object({ body: z.string() }).partial().optional(),
    })
    .partial()
    .optional(),
  /** For status webhooks. */
  status: z.string().optional(),
  messageId: z.string().optional(),
  /** Catch-all. */
}).passthrough();
export type AiSensyInbound = z.infer<typeof AiSensyInbound>;

/** Verify the bearer token sent by AiSensy in the Authorization header. */
export function verifyAiSensyBearer(headerValue: string | null, expected: string): boolean {
  if (!headerValue || !expected) return false;
  const prefix = 'Bearer ';
  if (!headerValue.startsWith(prefix)) return false;
  const got = Buffer.from(headerValue.slice(prefix.length));
  const want = Buffer.from(expected);
  if (got.length !== want.length) return false;
  try {
    return timingSafeEqual(got, want);
  } catch {
    return false;
  }
}

export function extractInboundText(payload: AiSensyInbound): string | null {
  return payload.message?.text?.body ?? null;
}

export function extractInboundSender(payload: AiSensyInbound): string | null {
  const id = payload.from ?? payload.waId;
  if (!id) return null;
  return id.startsWith('+') ? id : `+${id}`;
}
