import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { audit, db, orgMembers, users } from '@bharat/db';
import { orgProcedure, router } from '../trpc';
import { sendTemplate } from '@bharat/aisensy';
import { toE164 } from '@/lib/intl';

export const teamRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    return db
      .select({
        id: orgMembers.id,
        role: orgMembers.role,
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        invitedAt: orgMembers.invitedAt,
        acceptedAt: orgMembers.acceptedAt,
      })
      .from(orgMembers)
      .innerJoin(users, eq(users.id, orgMembers.userId))
      .where(eq(orgMembers.orgId, ctx.org.id));
  }),

  invite: orgProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(['admin', 'member', 'rep']).default('member'),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.org.role !== 'owner' && ctx.org.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const existing = (
        await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1)
      )[0];

      let userId = existing?.id;
      if (!userId) {
        const created = await db
          .insert(users)
          .values({ email: input.email, authId: `pending:${input.email}` })
          .returning({ id: users.id });
        userId = created[0]?.id;
        if (!userId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      await db.insert(orgMembers).values({
        orgId: ctx.org.id,
        userId,
        role: input.role,
        invitedAt: new Date(),
        invitedByUserId: ctx.user.id,
      });

      if (input.phone) {
        try {
          await sendTemplate({
            to: toE164(input.phone),
            campaignName: 'team_invite',
            variables: [ctx.org.name, ctx.user.email],
          });
        } catch {
          /* non-blocking */
        }
      }

      await audit({
        actorUserId: ctx.user.id,
        action: 'team.invite',
        target: `org:${ctx.org.id}`,
        payload: { invitedEmail: input.email, role: input.role },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { ok: true };
    }),

  revoke: orgProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.org.role !== 'owner' && ctx.org.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      await db
        .update(orgMembers)
        .set({ revokedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, ctx.org.id)));
      return { ok: true };
    }),
});
