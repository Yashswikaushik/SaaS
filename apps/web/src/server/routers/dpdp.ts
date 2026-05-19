import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { audit, db, dsrRequests } from '@bharat/db';
import { CONSENT_SCOPES, CURRENT_NOTICE_VERSION, eraseDataPrincipal, getLatestConsent, recordConsent } from '@bharat/dpdp';
import { authedProcedure, router } from '../trpc';

export const dpdpRouter = router({
  consents: authedProcedure.query(async ({ ctx }) => {
    const out: Record<string, { granted: boolean; grantedAt?: string; noticeVersion?: string } | null> = {};
    await Promise.all(
      CONSENT_SCOPES.map(async (s) => {
        const c = await getLatestConsent(ctx.user.id, s);
        out[s] = c ? { granted: c.granted, grantedAt: c.grantedAt, noticeVersion: c.noticeVersion } : null;
      }),
    );
    return { noticeVersion: CURRENT_NOTICE_VERSION, scopes: out };
  }),

  setConsent: authedProcedure
    .input(
      z.object({
        scope: z.enum(CONSENT_SCOPES as unknown as [string, ...string[]]),
        granted: z.boolean(),
        source: z.string().default('settings'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.scope === 'essential' && input.granted === false) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Essential cannot be revoked without erasing your account' });
      }
      await recordConsent({
        userId: ctx.user.id,
        scope: input.scope as never,
        granted: input.granted,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        source: input.source,
      });
      return { ok: true };
    }),

  requestExport: authedProcedure.mutation(async ({ ctx }) => {
    const rows = await db
      .insert(dsrRequests)
      .values({ userId: ctx.user.id, kind: 'export', status: 'pending' })
      .returning({ id: dsrRequests.id });
    await audit({
      actorUserId: ctx.user.id,
      action: 'dpdp.export.requested',
      target: `user:${ctx.user.id}`,
      payload: { requestId: rows[0]?.id },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { requestId: rows[0]?.id };
  }),

  requestErase: authedProcedure
    .input(z.object({ confirm: z.literal('ERASE') }))
    .mutation(async ({ ctx }) => {
      const rows = await db
        .insert(dsrRequests)
        .values({ userId: ctx.user.id, kind: 'erase', status: 'in_progress' })
        .returning({ id: dsrRequests.id });
      const id = rows[0]?.id;
      if (!id) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      await eraseDataPrincipal(ctx.user.id, id);
      return { requestId: id };
    }),

  requestCorrect: authedProcedure
    .input(
      z.object({
        fullName: z.string().min(1).max(100).optional(),
        phone: z.string().min(8).max(16).optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await audit({
        actorUserId: ctx.user.id,
        action: 'dpdp.correct.requested',
        target: `user:${ctx.user.id}`,
        payload: input,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      const rows = await db
        .insert(dsrRequests)
        .values({ userId: ctx.user.id, kind: 'correct', status: 'pending', payload: input })
        .returning({ id: dsrRequests.id });
      return { requestId: rows[0]?.id };
    }),

  recentRequests: authedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(dsrRequests)
      .where(eq(dsrRequests.userId, ctx.user.id))
      .orderBy(desc(dsrRequests.createdAt))
      .limit(20);
  }),
});
