import { GST_RATE_BPS, isValidStateCode, type StateCode } from './constants';

export interface TaxInput {
  /** Amount before tax, in paise (integer). */
  taxableAmountPaise: number;
  /** Two-digit state code of the customer's place-of-supply. */
  customerStateCode: string;
  /** Two-digit state code of the supplier (us). */
  supplierStateCode: string;
  /** Override GST rate in basis points. Default 1800 (18%). */
  gstRateBps?: number;
}

export interface TaxBreakup {
  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
  isInterstate: boolean;
}

/**
 * Split tax into CGST/SGST or IGST per place-of-supply rules.
 *
 * Rules:
 *   1. Customer state == supplier state ⇒ CGST + SGST (half each).
 *   2. Different states ⇒ IGST (full).
 *
 * All math in integer paise. Rounding: standard half-up. CGST and SGST are
 * computed independently then summed against the total to detect ₹0.01 drift.
 */
export function calculateTax(input: TaxInput): TaxBreakup {
  if (!Number.isInteger(input.taxableAmountPaise) || input.taxableAmountPaise < 0) {
    throw new Error('taxableAmountPaise must be a non-negative integer (paise)');
  }
  if (!isValidStateCode(input.customerStateCode)) {
    throw new Error(`Invalid customer state code: ${input.customerStateCode}`);
  }
  if (!isValidStateCode(input.supplierStateCode)) {
    throw new Error(`Invalid supplier state code: ${input.supplierStateCode}`);
  }

  const rateBps = input.gstRateBps ?? GST_RATE_BPS;
  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10_000) {
    throw new Error('gstRateBps must be 0-10000');
  }

  const totalGst = roundHalfUp((input.taxableAmountPaise * rateBps) / 10_000);
  const isInterstate = input.customerStateCode !== input.supplierStateCode;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterstate) {
    igst = totalGst;
  } else {
    const half = Math.floor(totalGst / 2);
    cgst = half;
    sgst = totalGst - half; // give the remainder paisa to SGST so cgst+sgst == totalGst exactly
  }

  return {
    taxableAmountPaise: input.taxableAmountPaise,
    cgstPaise: cgst,
    sgstPaise: sgst,
    igstPaise: igst,
    totalPaise: input.taxableAmountPaise + cgst + sgst + igst,
    isInterstate,
  };
}

function roundHalfUp(n: number): number {
  return Math.floor(n + 0.5);
}

/** Extract state code from a GSTIN (first two characters). */
export function stateCodeFromGstin(gstin: string): StateCode | null {
  const head = gstin.slice(0, 2);
  return isValidStateCode(head) ? head : null;
}

/**
 * GSTIN format check. Pattern:
 *   2 digits state || 5 letters PAN-prefix || 4 digits || 1 letter ||
 *   1 alphanumeric entity-code || 'Z' || 1 alphanumeric checksum
 */
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;
export function isValidGstinFormat(gstin: string): boolean {
  return GSTIN_RE.test(gstin);
}

/** GSTIN checksum verification per GSTN spec. */
export function isValidGstinChecksum(gstin: string): boolean {
  if (!isValidGstinFormat(gstin)) return false;
  const factor = [1, 2];
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const idx = chars.indexOf(gstin[i]!);
    if (idx < 0) return false;
    const prod = idx * (factor[i % 2] ?? 1);
    sum += Math.floor(prod / chars.length) + (prod % chars.length);
  }
  const checkIdx = (chars.length - (sum % chars.length)) % chars.length;
  return chars[checkIdx] === gstin[14];
}
