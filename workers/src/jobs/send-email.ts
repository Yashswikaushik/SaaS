import { Resend } from 'resend';
import { and, eq } from 'drizzle-orm';
import { audit, db, leadMessages } from '@bharat/db';
import { makeQueue, makeWorker } from '../queue';

export interface SendEmailJob {
  messageId: string;
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export const sendEmailQueue = makeQueue<SendEmailJob>('send-email');

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailWorker = makeWorker<SendEmailJob>(
  'send-email',
  async (job) => {
    const from = job.data.from ?? process.env.EMAIL_FROM ?? 'hello@bharatleads.in';
    try {
      const r = await resend.emails.send({
        from,
        to: job.data.to,
        subject: job.data.subject,
        text: job.data.body,
      });
      if (r.error) throw new Error(r.error.message);
      await db
        .update(leadMessages)
        .set({
          status: 'sent',
          providerMessageId: r.data?.id,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leadMessages.id, job.data.messageId));
      await audit({
        actorService: 'send-email-worker',
        action: 'email.send.success',
        target: `message:${job.data.messageId}`,
        payload: { providerId: r.data?.id },
      });
    } catch (err) {
      const msg = (err as Error).message;
      await db
        .update(leadMessages)
        .set({ status: 'failed', lastError: msg.slice(0, 1024), updatedAt: new Date() })
        .where(eq(leadMessages.id, job.data.messageId));
      throw err;
    }
  },
  { concurrency: 8 },
);
