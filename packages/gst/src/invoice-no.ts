import { sql } from 'drizzle-orm';
import { type Database } from '@bharat/db';
import { invoices } from '@bharat/db';

/** Compute the fiscal year for a date: Apr 1 to Mar 31 → '2025-26'. */
export function getFiscalYear(date: Date, tzOffsetMinutes = 330 /* IST */): string {
  // Shift to IST and read the calendar date
  const ist = new Date(date.getTime() + tzOffsetMinutes * 60 * 1000);
  const month = ist.getUTCMonth(); // 0=Jan
  const year = ist.getUTCFullYear();
  const fyStart = month >= 3 ? year : year - 1;
  const fyEnd = fyStart + 1;
  return `${fyStart}-${String(fyEnd).slice(-2)}`;
}

/**
 * Allocate the next FY-sequential invoice number, atomically.
 * Uses a Postgres transactional advisory lock keyed on FY so that
 * concurrent inserts in the same FY serialize cleanly.
 *
 * Format: `BL/2025-26/00001`. Width 5 — supports 99,999 invoices/year.
 */
export async function allocateInvoiceNumber(db: Database, fiscalYear: string): Promise<string> {
  const lockKey = `invoice_no:${fiscalYear}`;
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
    const row = await tx.execute<{ max_no: number | null }>(
      sql`select max(cast(split_part(invoice_no, '/', 3) as int)) as max_no
          from ${invoices}
          where ${invoices.fiscalYear} = ${fiscalYear}`,
    );
    const next = ((row[0]?.max_no ?? 0) as number) + 1;
    return `BL/${fiscalYear}/${String(next).padStart(5, '0')}`;
  });
}
