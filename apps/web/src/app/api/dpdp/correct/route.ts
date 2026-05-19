import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { correctDataPrincipal, db, users } from '@bharat/db';
import { supabaseServer } from '@/lib/supabase-server';
import { toE164 } from '@/lib/intl';

const Patch = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<NextResponse> {
  const sb = supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return new NextResponse('unauthorized', { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return new NextResponse('invalid', { status: 400 });

  const userRow = (
    await db.select().from(users).where(eq(users.authId, data.user.id)).limit(1)
  )[0];
  if (!userRow) return new NextResponse('not found', { status: 404 });

  const patch: Parameters<typeof correctDataPrincipal>[1] = { ...parsed.data };
  if (patch.phone) {
    try {
      patch.phone = toE164(patch.phone);
    } catch {
      return new NextResponse('invalid phone', { status: 400 });
    }
  }
  await correctDataPrincipal(userRow.id, patch);
  return NextResponse.json({ ok: true });
}
