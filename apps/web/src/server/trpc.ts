import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@bharat/db';
import { eq } from 'drizzle-orm';
import { users, orgMembers, orgs } from '@bharat/db';
import { supabaseServer } from '@/lib/supabase-server';
import { log } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

export interface AuthedUser {
  id: string;
  authId: string;
  email: string;
  fullName: string | null;
  locale: string;
}

export interface AuthedOrg {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'growth' | 'scale' | 'agency';
  planStatus: string;
  role: 'owner' | 'admin' | 'member' | 'rep';
}

export interface Context {
  ip: string;
  userAgent: string;
  user: AuthedUser | null;
  org: AuthedOrg | null;
}

export async function createContext(req: Request): Promise<Context> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0';
  const userAgent = req.headers.get('user-agent') ?? '';

  let user: AuthedUser | null = null;
  let org: AuthedOrg | null = null;

  try {
    const sb = supabaseServer();
    const { data, error } = await sb.auth.getUser();
    if (data.user && !error) {
      const row = (
        await db
          .select({
            id: users.id,
            authId: users.authId,
            email: users.email,
            fullName: users.fullName,
            locale: users.locale,
          })
          .from(users)
          .where(eq(users.authId, data.user.id))
          .limit(1)
      )[0];
      if (row) user = row;

      const orgSlug = req.headers.get('x-org-slug');
      if (orgSlug && row) {
        const oRow = (
          await db
            .select({
              id: orgs.id,
              name: orgs.name,
              slug: orgs.slug,
              plan: orgs.plan,
              planStatus: orgs.planStatus,
              role: orgMembers.role,
            })
            .from(orgs)
            .innerJoin(orgMembers, eq(orgMembers.orgId, orgs.id))
            .where(eq(orgs.slug, orgSlug))
            .limit(1)
        )[0];
        if (oRow && oRow.role) {
          org = {
            id: oRow.id,
            name: oRow.name,
            slug: oRow.slug,
            plan: oRow.plan,
            planStatus: oRow.planStatus,
            role: oRow.role,
          };
        }
      }
    }
  } catch (err) {
    log.warn('createContext auth failure', { err: (err as Error).message });
  }

  return { ip, userAgent, user, org };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const logging = middleware(async ({ ctx, path, type, next }) => {
  const started = Date.now();
  const r = await next();
  log.info('trpc', {
    path,
    type,
    durMs: Date.now() - started,
    userId: ctx.user?.id ?? null,
    orgId: ctx.org?.id ?? null,
    ok: r.ok,
  });
  return r;
});

const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requireOrg = middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  if (!ctx.org) throw new TRPCError({ code: 'FORBIDDEN', message: 'Org context required' });
  return next({ ctx: { ...ctx, user: ctx.user, org: ctx.org } });
});

const rateLimitByIp = (limit: number, windowSeconds: number) =>
  middleware(async ({ ctx, path, next }) => {
    const r = await rateLimit({ key: `${path}:${ctx.ip}`, limit, windowSeconds });
    if (!r.ok) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
    return next();
  });

export const procedure = t.procedure.use(logging);
export const authedProcedure = procedure.use(isAuthed);
export const orgProcedure = procedure.use(requireOrg);
export const throttled = (limit = 10, windowSeconds = 60) => procedure.use(rateLimitByIp(limit, windowSeconds));
