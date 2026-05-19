import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db, razorpayProcessedEvents } from '@bharat/db';

/**
 * Run `handler` exactly once per `eventId`. Concurrent invocations with the
 * same id are serialized by a Postgres unique constraint on
 * `razorpay_processed_events.event_id` — duplicates short-circuit to a no-op.
 *
 * @returns `processed` true on first run, false if event was already seen.
 */
export async function withIdempotency(
  eventId: string,
  rawBody: string,
  handler: () => Promise<void>,
): Promise<{ processed: boolean }> {
  if (!eventId) throw new Error('withIdempotency requires a non-empty eventId');
  const payloadHash = createHash('sha256').update(rawBody).digest('hex');

  const result = await db.execute<{ event_id: string }>(
    sql`insert into ${razorpayProcessedEvents} (event_id, event_type, payload_hash)
        values (${eventId}, ${''}, ${payloadHash})
        on conflict (event_id) do nothing
        returning event_id`,
  );

  if (result.length === 0) {
    return { processed: false };
  }

  try {
    await handler();
  } catch (err) {
    // Roll the dedup record back so a retry can re-run the handler.
    await db.execute(
      sql`delete from ${razorpayProcessedEvents} where event_id = ${eventId}`,
    );
    throw err;
  }

  return { processed: true };
}
