import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { audit, db, invoices, orgs, subscriptions } from '@bharat/db';
import { PLAN_PRICING, type PlanPricing } from '@bharat/razorpay/plans';
import {
  cancelSubscription,
  createSubscription,
  pauseSubscription,
  resumeSubscription,
} from '@bharat/razorpay/subscriptions';
import { orgProcedure, router } from '../trpc';

const TierEnum = z.enum(['starter', 'growth', 'scale', 'agency']);
const CycleEnum = z.enum(['monthly', 'yearly']);

export const billingRouter = router({
  plans: orgProcedure.query(async () => {
    return Object.values(PLAN_PRICING).map((p) => ({
      tier: p.tier,
      monthlyPaise: p.monthlyPaise,
      annualPaise: p.annualPaise,
      leadCap: p.leadCap,
      seatCap: p.seatCap,
      aiEmailsPerLead: Number.isFinite(p.aiEmailsPerLead) ? p.aiEmailsPerLead : 9999,
      reviewsPerLead: p.reviewsPerLead,
      waMessagesPerMonth: p.waMessagesPerMonth,
      routesEnabled: p.routesEnabled,
      aiAssistantEnabled: p.aiAssistantEnabled,
      whiteLabelEnabled: p.whiteLabelEnabled,
    }));
  }),

  startSubscription: orgProcedure
    .input(z.object({ tier: TierEnum, cycle: CycleEnum }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.org.role !== 'owner' && ctx.org.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners/admins can change plans' });
      }

      const sub = await createSubscription({
        tier: input.tier as PlanPricing['tier'],
        cycle: input.cycle,
        orgId: ctx.org.id,
      });

      const pricing = PLAN_PRICING[input.tier as PlanPricing['tier']];
      const amount = input.cycle === 'monthly' ? pricing.monthlyPaise : pricing.annualPaise;

      await db.insert(subscriptions).values({
        orgId: ctx.org.id,
        plan: input.tier,
        cycle: input.cycle,
        razorpaySubscriptionId: sub.id,
        razorpayPlanId: sub.planId,
        status: sub.status,
        amountPaise: amount,
        notes: sub.notes,
      });

      await audit({
        actorUserId: ctx.user.id,
        action: 'billing.subscription.created',
        target: `org:${ctx.org.id}`,
        payload: { tier: input.tier, cycle: input.cycle, subId: sub.id },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { subscriptionId: sub.id, shortUrl: sub.shortUrl, amountPaise: amount };
    }),

  cancel: orgProcedure
    .input(z.object({ subscriptionId: z.string(), cancelAtCycleEnd: z.boolean().default(true) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.org.role !== 'owner') throw new TRPCError({ code: 'FORBIDDEN' });
      const sub = (
        await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.razorpaySubscriptionId, input.subscriptionId),
              eq(subscriptions.orgId, ctx.org.id),
            ),
          )
          .limit(1)
      )[0];
      if (!sub) throw new TRPCError({ code: 'NOT_FOUND' });

      await cancelSubscription(input.subscriptionId, input.cancelAtCycleEnd);
      await db
        .update(subscriptions)
        .set({ cancelAtCycleEnd: input.cancelAtCycleEnd, updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));

      await audit({
        actorUserId: ctx.user.id,
        action: 'billing.subscription.cancelled',
        target: `org:${ctx.org.id}`,
        payload: { subId: input.subscriptionId, cancelAtCycleEnd: input.cancelAtCycleEnd },
      });
      return { ok: true };
    }),

  pause: orgProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.org.role !== 'owner') throw new TRPCError({ code: 'FORBIDDEN' });
      await pauseSubscription(input.subscriptionId);
      return { ok: true };
    }),

  resume: orgProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.org.role !== 'owner') throw new TRPCError({ code: 'FORBIDDEN' });
      await resumeSubscription(input.subscriptionId);
      return { ok: true };
    }),

  invoices: orgProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(invoices)
      .where(eq(invoices.orgId, ctx.org.id))
      .orderBy(desc(invoices.issuedAt))
      .limit(100);
  }),

  currentSubscription: orgProcedure.query(async ({ ctx }) => {
    const row = (
      await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.orgId, ctx.org.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)
    )[0];
    return row ?? null;
  }),

  updateBillingDetails: orgProcedure
    .input(
      z.object({
        legalName: z.string().min(2).max(120).optional(),
        gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
        pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
        billingStateCode: z.string().regex(/^\d{2}$/).optional(),
        billingPincode: z.string().regex(/^\d{6}$/).optional(),
        billingAddressLine1: z.string().min(3).max(200).optional(),
        billingAddressLine2: z.string().max(200).optional(),
        billingCity: z.string().max(80).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.org.role !== 'owner' && ctx.org.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      await db.update(orgs).set({ ...input, updatedAt: new Date() }).where(eq(orgs.id, ctx.org.id));
      return { ok: true };
    }),
});
