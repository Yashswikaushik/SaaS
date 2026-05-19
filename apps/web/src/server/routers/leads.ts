import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { audit, db, leadNotes, leads, orgs } from '@bharat/db';
import { CATEGORY_IDS, searchInPolygon } from '@bharat/scraper';
import { orgProcedure, router } from '../trpc';

const PolygonInput = z
  .array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]))
  .min(3)
  .max(200);

export const leadsRouter = router({
  searchInArea: orgProcedure
    .input(
      z.object({
        polygon: PolygonInput,
        categories: z.array(z.enum(CATEGORY_IDS as unknown as [string, ...string[]])).min(1).max(5),
        limit: z.number().int().min(1).max(500).default(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const orgRow = (
        await db.select().from(orgs).where(eq(orgs.id, ctx.org.id)).limit(1)
      )[0];
      if (!orgRow) throw new TRPCError({ code: 'NOT_FOUND' });

      const used = (
        await db.select({ c: count() }).from(leads).where(eq(leads.orgId, ctx.org.id))
      )[0]?.c ?? 0;

      const remaining = Math.max(0, orgRow.leadCap - Number(used));
      if (remaining === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Lead cap (${orgRow.leadCap}) reached on plan '${orgRow.plan}'. Upgrade to add more leads.`,
        });
      }

      const places = await searchInPolygon({
        polygon: input.polygon,
        categories: input.categories as never,
        limit: Math.min(input.limit, remaining),
      });

      if (places.length === 0) {
        return { inserted: 0, leads: [] };
      }

      const now = new Date();
      const rows = places.map((p) => ({
        orgId: ctx.org.id,
        ownerUserId: ctx.user.id,
        sourceUrl: p.sourceUrl,
        sourceMethod: 'geoapify_api' as const,
        sourceVerifiedAt: now,
        externalId: p.externalId,
        businessName: p.businessName,
        category: p.category,
        lat: p.lat,
        lng: p.lng,
        addressFormatted: p.addressFormatted,
        city: p.city,
        state: p.state,
        pincode: p.pincode,
        countryCode: p.countryCode,
        contact: {
          website: p.website,
          email: p.email,
          mobile: p.phone,
        },
      }));

      const inserted = await db
        .insert(leads)
        .values(rows)
        .onConflictDoNothing({
          target: [leads.orgId, leads.sourceMethod, leads.externalId],
        })
        .returning();

      await audit({
        actorUserId: ctx.user.id,
        action: 'leads.searchInArea',
        target: `org:${ctx.org.id}`,
        payload: { polygonPoints: input.polygon.length, categories: input.categories, inserted: inserted.length },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { inserted: inserted.length, leads: inserted };
    }),

  list: orgProcedure
    .input(
      z.object({
        status: z
          .enum(['new', 'contacted', 'qualified', 'meeting_set', 'won', 'lost', 'on_hold'])
          .optional(),
        limit: z.number().int().min(1).max(200).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const where = input.status
        ? and(eq(leads.orgId, ctx.org.id), eq(leads.status, input.status), sql`${leads.deletedAt} is null`)
        : and(eq(leads.orgId, ctx.org.id), sql`${leads.deletedAt} is null`);
      const rows = await db
        .select()
        .from(leads)
        .where(where)
        .orderBy(desc(leads.createdAt))
        .limit(input.limit + 1);
      const hasMore = rows.length > input.limit;
      return {
        items: rows.slice(0, input.limit),
        nextCursor: hasMore ? rows[input.limit - 1]?.id ?? null : null,
      };
    }),

  byId: orgProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input, ctx }) => {
    const row = (
      await db
        .select()
        .from(leads)
        .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.org.id)))
        .limit(1)
    )[0];
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    return row;
  }),

  updateStatus: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['new', 'contacted', 'qualified', 'meeting_set', 'won', 'lost', 'on_hold']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const r = await db
        .update(leads)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.org.id)))
        .returning({ id: leads.id });
      if (r.length === 0) throw new TRPCError({ code: 'NOT_FOUND' });
      return { ok: true };
    }),

  addNote: orgProcedure
    .input(z.object({ leadId: z.string().uuid(), body: z.string().min(1).max(4_000) }))
    .mutation(async ({ input, ctx }) => {
      // Verify lead is in current org
      const owner = (
        await db
          .select({ id: leads.id })
          .from(leads)
          .where(and(eq(leads.id, input.leadId), eq(leads.orgId, ctx.org.id)))
          .limit(1)
      )[0];
      if (!owner) throw new TRPCError({ code: 'NOT_FOUND' });

      await db.transaction(async (tx) => {
        await tx.insert(leadNotes).values({
          leadId: input.leadId,
          authorUserId: ctx.user.id,
          body: input.body,
        });
        await tx
          .update(leads)
          .set({ notesCount: sql`${leads.notesCount} + 1`, updatedAt: new Date() })
          .where(eq(leads.id, input.leadId));
      });
      return { ok: true };
    }),

  delete: orgProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input, ctx }) => {
    await db
      .update(leads)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.org.id)));
    return { ok: true };
  }),
});
