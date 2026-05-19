import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { audit, db, leads } from '@bharat/db';
import { assertConsent } from '@bharat/dpdp';
import { generateColdEmail, summarizeReviews } from '@bharat/ai';
import { orgProcedure, router } from '../trpc';

export const aiRouter = router({
  generateColdEmail: orgProcedure
    .input(
      z.object({
        leadId: z.string().uuid(),
        myOffer: z.string().min(20).max(800),
        signature: z.string().min(3).max(200),
        tone: z.enum(['consultative', 'direct', 'curious', 'formal']).default('consultative'),
        language: z.enum(['en', 'hi-roman', 'hi', 'auto']).default('auto'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertConsent({ userId: ctx.user.id, scope: 'ai_processing' });

      const lead = (
        await db
          .select()
          .from(leads)
          .where(and(eq(leads.id, input.leadId), eq(leads.orgId, ctx.org.id)))
          .limit(1)
      )[0];
      if (!lead) throw new TRPCError({ code: 'NOT_FOUND' });

      if (!lead.sourceVerifiedAt) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Lead source not verified — cannot generate outreach',
        });
      }

      const result = await generateColdEmail({
        business: {
          name: lead.businessName,
          category: lead.category ?? undefined,
          city: lead.city ?? undefined,
          state: lead.state ?? undefined,
          website: (lead.contact as { website?: string }).website,
        },
        painSignal: lead.aiReviewSummary ?? undefined,
        myOffer: input.myOffer,
        signature: input.signature,
        tone: input.tone,
        language: input.language,
      });

      await audit({
        actorUserId: ctx.user.id,
        action: 'ai.generateColdEmail',
        target: `lead:${lead.id}`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        payload: { variants: result.variants.length },
      });

      return result;
    }),

  summarizeReviews: orgProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await assertConsent({ userId: ctx.user.id, scope: 'ai_processing' });

      const lead = (
        await db
          .select()
          .from(leads)
          .where(and(eq(leads.id, input.leadId), eq(leads.orgId, ctx.org.id)))
          .limit(1)
      )[0];
      if (!lead) throw new TRPCError({ code: 'NOT_FOUND' });

      const snippets = (lead.reviews?.snippets ?? []).map((s) => ({
        text: s.text,
        rating: s.rating,
        date: s.date,
      }));

      const result = await summarizeReviews({
        businessName: lead.businessName,
        rating: lead.reviews?.rating,
        reviewCount: lead.reviews?.count,
        snippets,
      });

      const angle = result.outreachAngle.slice(0, 320);

      await db
        .update(leads)
        .set({ aiReviewSummary: angle, aiReviewSummaryAt: new Date(), updatedAt: new Date() })
        .where(eq(leads.id, lead.id));

      await audit({
        actorUserId: ctx.user.id,
        action: 'ai.summarizeReviews',
        target: `lead:${lead.id}`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        payload: { confidence: result.confidence },
      });

      return result;
    }),
});
