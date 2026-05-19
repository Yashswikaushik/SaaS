import { Resend } from 'resend';
import { eq } from 'drizzle-orm';
import { audit, db, orgs, subscriptions, users } from '@bharat/db';
import { sendTemplate } from '@bharat/aisensy';
import { makeQueue, makeWorker } from '../queue';

export interface DunningJob {
  orgId: string;
  attempt: 1 | 2 | 3;
  subscriptionId: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const dunningQueue = makeQueue<DunningJob>('dunning');

export const dunningWorker = makeWorker<DunningJob>(
  'dunning',
  async (job) => {
    const orgRow = (await db.select().from(orgs).where(eq(orgs.id, job.data.orgId)).limit(1))[0];
    if (!orgRow) return;
    const owner = (await db.select().from(users).where(eq(users.id, orgRow.ownerUserId)).limit(1))[0];
    if (!owner) return;

    const subject = `Action needed: payment for ${orgRow.name} failed (try ${job.data.attempt}/3)`;
    const body = `Hi${owner.fullName ? ' ' + owner.fullName : ''},

Your last subscription charge for Bharat Leads (${orgRow.name}, plan: ${orgRow.plan}) did not go through.

We'll retry automatically. To resolve now, update your payment method:
${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bharatleads.in'}/app/billing

After 3 failed attempts your account will be paused; nothing will be deleted.

— Bharat Leads`;

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'billing@bharatleads.in',
        to: owner.email,
        subject,
        text: body,
      });
    } catch {
      /* email failure non-fatal */
    }
    if (owner.phone) {
      try {
        await sendTemplate({
          to: owner.phone,
          campaignName: 'dunning_v1',
          variables: [orgRow.name, String(job.data.attempt)],
        });
      } catch {
        /* WA failure non-fatal */
      }
    }
    await audit({
      actorService: 'dunning-worker',
      action: 'billing.dunning.attempt',
      target: `org:${orgRow.id}`,
      payload: { attempt: job.data.attempt },
    });
  },
  { concurrency: 4 },
);
