import { eq } from 'drizzle-orm';
import { audit, db, dsrRequests, hardPurgeDataPrincipal, pendingPurges } from '@bharat/db';
import { makeQueue, makeWorker } from '../queue';

export interface PurgeJob {
  trigger: 'cron' | 'manual';
}

export const purgeQueue = makeQueue<PurgeJob>('purge');

export const purgeWorker = makeWorker<PurgeJob>(
  'purge',
  async () => {
    const due = await pendingPurges();
    for (const d of due) {
      await hardPurgeDataPrincipal(d.userId);
      await db
        .update(dsrRequests)
        .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
        .where(eq(dsrRequests.id, d.id));
      await audit({
        actorService: 'purge-worker',
        action: 'dpdp.erase.purged',
        target: `user:${d.userId}`,
        payload: { requestId: d.id },
      });
    }
  },
  { concurrency: 1 },
);
