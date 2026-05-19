import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import {
  audit,
  db,
  leadMessages,
  leads,
  orgs,
  waTemplates,
} from '@bharat/db';
import { estimateBroadcastCostPaise, sendTemplate } from '@bharat/aisensy';
import { assertConsent } from '@bharat/dpdp/consent-manager';
import { generateWaCold } from '@bharat/ai';
import { toE164 } from '@/lib/intl';
import { orgProcedure, router } from '../trpc';

export const whatsappRouter = router({
  listTemplates: orgProcedure.query(async ({ ctx }) => {
    return db.select().from(waTemplates).where(eq(waTemplates.orgId, ctx.org.id));
  }),

  sendToLead: orgProcedure
    .input(
      z.object({
        leadId: z.string().uuid(),
        templateName: z.string().min(2),
        myOffer: z.string().min(10).max(800),
        language: z.enum(['en', 'hi-roman', 'hi']).default('en'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertConsent({ userId: ctx.user.id, scope: 'marketing' });
      await assertConsent({ userId: ctx.user.id, scope: 'ai_processing' });

      const lead = (
        await db
          .select()
          .from(leads)
          .where(and(eq(leads.id, input.leadId), eq(leads.orgId, ctx.org.id)))
          .limit(1)
      )[0];
      if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

      const phone = (lead.contact as { mobile?: string; whatsapp?: string }).whatsapp
        ?? (lead.contact as { mobile?: string }).mobile;
      if (!phone) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Lead has no phone' });
      const recipient = toE164(phone);

      const tmpl = (
        await db.select().from(waTemplates).where(eq(waTemplates.name, input.templateName)).limit(1)
      )[0];
      if (!tmpl || tmpl.status !== 'APPROVED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Template not approved' });
      }

      const org = (await db.select().from(orgs).where(eq(orgs.id, ctx.org.id)).limit(1))[0];
      if (!org) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      // Generate variables for this lead
      const gen = await generateWaCold({
        business: {
          name: lead.businessName,
          category: lead.category ?? undefined,
          city: lead.city ?? undefined,
        },
        painSignal: lead.aiReviewSummary ?? undefined,
        myOffer: input.myOffer,
        templateBody: tmpl.body,
        language: input.language,
      });

      const send = await sendTemplate({
        to: recipient,
        campaignName: input.templateName,
        userName: lead.businessName,
        variables: [gen.templateVariables.greeting, gen.templateVariables.hook, gen.templateVariables.cta],
        attributes: { leadId: lead.id, orgId: ctx.org.id },
      });

      const consentSnap = {
        scope: 'marketing',
        granted: true,
        granted_at: new Date().toISOString(),
        notice_version: '2025-11-13',
      } as const;

      await db.insert(leadMessages).values({
        orgId: ctx.org.id,
        leadId: lead.id,
        senderUserId: ctx.user.id,
        channel: 'whatsapp',
        direction: 'outbound',
        status: 'sent',
        toAddress: recipient,
        body: tmpl.body,
        aiGenerated: JSON.stringify(gen.templateVariables),
        consentSnapshot: consentSnap,
        providerMessageId: send.messageId,
        templateName: input.templateName,
        sentAt: new Date(),
      });

      await audit({
        actorUserId: ctx.user.id,
        action: 'whatsapp.send',
        target: `lead:${lead.id}`,
        payload: { templateName: input.templateName, messageId: send.messageId },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { messageId: send.messageId };
    }),

  estimateCost: orgProcedure
    .input(
      z.object({
        recipients: z.number().int().min(1).max(100_000),
        category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
      }),
    )
    .query(async ({ input }) => {
      return { paise: estimateBroadcastCostPaise(input.recipients, input.category) };
    }),
});
