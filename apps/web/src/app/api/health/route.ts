import { NextResponse } from 'next/server';
import { pingDb } from '@bharat/db';

export const runtime = 'nodejs';

export async function GET() {
  const dbOk = await pingDb();
  const ok = dbOk;
  return NextResponse.json(
    { ok, db: dbOk, ts: new Date().toISOString() },
    { status: ok ? 200 : 503 },
  );
}
