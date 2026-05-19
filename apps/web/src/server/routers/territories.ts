import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { audit, db, territories } from '@bharat/db';
import { orgProcedure, router } from '../trpc';

const PolygonGeoJson = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()])).min(4)).min(1),
});

export const territoriesRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    return db.select().from(territories).where(eq(territories.orgId, ctx.org.id));
  }),

  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(80),
        description: z.string().max(400).optional(),
        polygon: PolygonGeoJson,
        assignedUserId: z.string().uuid().optional(),
        color: z.string().regex(/^#[0-9a-f]{6}$/i).default('#3b82f6'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.org.role === 'rep') throw new TRPCError({ code: 'FORBIDDEN' });
      const rows = await db
        .insert(territories)
        .values({
          orgId: ctx.org.id,
          name: input.name,
          description: input.description ?? null,
          polygon: input.polygon,
          assignedUserId: input.assignedUserId ?? null,
          color: input.color,
        })
        .returning();
      await audit({
        actorUserId: ctx.user.id,
        action: 'territories.create',
        target: `org:${ctx.org.id}`,
        payload: { name: input.name },
      });
      return rows[0];
    }),

  delete: orgProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input, ctx }) => {
    if (ctx.org.role === 'rep') throw new TRPCError({ code: 'FORBIDDEN' });
    await db
      .delete(territories)
      .where(and(eq(territories.id, input.id), eq(territories.orgId, ctx.org.id)));
    return { ok: true };
  }),
});
