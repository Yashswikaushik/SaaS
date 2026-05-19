import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<NextResponse> {
  const sb = supabaseServer();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL('/', req.url), { status: 303 });
}
