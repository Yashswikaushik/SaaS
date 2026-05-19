---
name: gst-invoice
description: India GST invoice generation — CGST/SGST/IGST split, SAC 998314, FY-sequential invoice numbers, place-of-supply logic. Use when creating invoices, generating PDFs, or calculating tax. Trigger on mentions of GST, invoice, CGST, SGST, IGST, HSN, SAC, place of supply.
---

# GST invoicing

## Constants
- SaaS HSN/SAC: **998314** (Information technology consulting & support services)
- GST rate: **18%**
- Org billing state: env `ORG_BILLING_STATE_CODE` (default `29` = Karnataka)

## Split rule
```ts
function splitTax({ customerStateCode, taxableAmount, orgStateCode }) {
  const gst = Math.round(taxableAmount * 0.18);
  if (customerStateCode === orgStateCode) {
    return { cgst: gst / 2, sgst: gst / 2, igst: 0 };
  }
  return { cgst: 0, sgst: 0, igst: gst };
}
```

For unregistered B2C customers (no GSTIN): place-of-supply = customer's billing state.
For B2B with GSTIN: place-of-supply = customer's GSTIN state (first 2 digits).
Export of services (foreign customer): zero-rated, capture LUT details. Out of scope for v1.

## Invoice number — FY-sequential
- Format: `BL/2025-26/00001`
- Uses Postgres advisory lock to prevent race:
```sql
SELECT pg_advisory_xact_lock(hashtext('invoice_no:' || $fy));
INSERT INTO invoices (...) VALUES (...) RETURNING invoice_no;
```
- FY logic: Apr 1 → Mar 31. Helper `getFiscalYear(date) → '2025-26'`.

## Invoice fields (required by GST law)
- Supplier name, address, GSTIN, state
- Recipient name, address, GSTIN (if registered), state
- Invoice number (sequential), date
- Place of supply
- HSN/SAC code
- Description, quantity, unit, rate
- Taxable value
- CGST + SGST OR IGST (rate + amount)
- Total in figures and words

## E-invoicing (IRN)
- Mandatory above ₹5 Cr turnover (irrelevant Year 1).
- Schema designed to support `irn` and `irp_uploaded_at` fields when needed.

## PDF generation
- Use `@react-pdf/renderer` in `packages/gst/src/invoice-pdf.tsx`
- Store in Supabase storage bucket `invoices/`, signed-URL access only
- Filename: `BL-2025-26-00001.pdf`

## Tests
Cover:
- Karnataka customer → CGST + SGST
- Maharashtra customer → IGST
- Unregistered B2C in Tamil Nadu → IGST, place of supply = TN
- Round-trip: input ₹999 → CGST ₹89.91 + SGST ₹89.91 + total ₹1178.82
- FY rollover at midnight 31 Mar → 1 Apr
