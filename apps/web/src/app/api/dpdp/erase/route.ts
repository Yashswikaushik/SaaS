import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { audit, db, dsrRequests, eraseDataPrincipal, users } from '@bharat/db';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<NextResponse> {
  const sb = supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return new NextResponse('unauthorized', { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== 'ERASE') {
    return new NextResponse('confirm field must be the string "ERASE"', { status: 400 });
  }

  const userRow = (
    await db.select().from(users).where(eq(users.authId, data.user.id)).limit(1)
  )[0];
  if (!userRow) return new NextResponse('not found', { status: 404 });

  const created = await db
    .insert(dsrRequests)
    .values({ userId: userRow.id, kind: 'erase', status: 'in_progress' })
    .returning({ id: dsrRequests.id });
  const id = created[0]?.id;
  if (!id) return new NextResponse('failed', { status: 500 });

  await eraseDataPrincipal(userRow.id, id);

  await audit({
    actorService: 'dpdp-erase',
    action: 'dpdp.erase.scheduled',
    target: `user:${userRow.id}`,
    payload: { requestId: id, purgeWindowDays: 30 },
  });

  return NextResponse.json({
    ok: true,
    requestId: id,
    softDeletedAt: new Date().toISOString(),
    purgeAfterDays: 30,
  });
}
