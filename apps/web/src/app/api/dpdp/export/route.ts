import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { audit, db, dsrRequests, exportDataPrincipal, users } from '@bharat/db';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  const sb = supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return new NextResponse('unauthorized', { status: 401 });

  const userRow = (
    await db.select().from(users).where(eq(users.authId, data.user.id)).limit(1)
  )[0];
  if (!userRow) return new NextResponse('not found', { status: 404 });

  const dump = await exportDataPrincipal(userRow.id);
  await audit({
    actorUserId: userRow.id,
    action: 'dpdp.export.served',
    target: `user:${userRow.id}`,
  });

  return new NextResponse(JSON.stringify(dump, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-disposition': `attachment; filename="bharatleads-export-${userRow.id}.json"`,
    },
  });
}
