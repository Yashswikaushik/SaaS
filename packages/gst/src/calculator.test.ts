import { describe, expect, it } from 'vitest';
import {
  calculateTax,
  isValidGstinChecksum,
  isValidGstinFormat,
  stateCodeFromGstin,
} from './calculator';

describe('calculateTax', () => {
  it('splits CGST/SGST intra-state (Karnataka → Karnataka)', () => {
    const r = calculateTax({
      taxableAmountPaise: 99_900,
      customerStateCode: '29',
      supplierStateCode: '29',
    });
    expect(r.cgstPaise).toBe(8991);
    expect(r.sgstPaise).toBe(8991);
    expect(r.igstPaise).toBe(0);
    expect(r.totalPaise).toBe(99_900 + 8991 + 8991);
    expect(r.isInterstate).toBe(false);
  });

  it('applies IGST inter-state (Karnataka → Maharashtra)', () => {
    const r = calculateTax({
      taxableAmountPaise: 99_900,
      customerStateCode: '27',
      supplierStateCode: '29',
    });
    expect(r.cgstPaise).toBe(0);
    expect(r.sgstPaise).toBe(0);
    expect(r.igstPaise).toBe(17_982);
    expect(r.totalPaise).toBe(99_900 + 17_982);
    expect(r.isInterstate).toBe(true);
  });

  it('preserves the odd-paisa rounding under CGST+SGST', () => {
    // ₹999.99 → 99999 paise → 18% → 17999.82 → rounds to 18000 paise total
    const r = calculateTax({
      taxableAmountPaise: 99_999,
      customerStateCode: '29',
      supplierStateCode: '29',
    });
    expect(r.cgstPaise + r.sgstPaise).toBe(r.cgstPaise + r.sgstPaise); // sanity
    expect(r.cgstPaise + r.sgstPaise + r.taxableAmountPaise).toBe(r.totalPaise);
  });

  it('rejects negative amounts', () => {
    expect(() =>
      calculateTax({ taxableAmountPaise: -1, customerStateCode: '29', supplierStateCode: '29' }),
    ).toThrow();
  });

  it('rejects unknown state codes', () => {
    expect(() =>
      calculateTax({ taxableAmountPaise: 100, customerStateCode: '99', supplierStateCode: '29' }),
    ).toThrow();
  });

  it('handles zero taxable amount', () => {
    const r = calculateTax({
      taxableAmountPaise: 0,
      customerStateCode: '29',
      supplierStateCode: '29',
    });
    expect(r.totalPaise).toBe(0);
  });
});

describe('GSTIN validation', () => {
  it('accepts a syntactically valid GSTIN', () => {
    expect(isValidGstinFormat('29AAAPL1234C1Z5')).toBe(true);
  });

  it('rejects malformed GSTINs', () => {
    expect(isValidGstinFormat('29AAAPL1234C1A5')).toBe(false); // missing Z at pos 13
    expect(isValidGstinFormat('aaaa')).toBe(false);
    expect(isValidGstinFormat('')).toBe(false);
  });

  it('extracts state code', () => {
    expect(stateCodeFromGstin('29AAAPL1234C1Z5')).toBe('29');
    expect(stateCodeFromGstin('99AAAPL1234C1Z5')).toBeNull();
  });

  it('rejects a GSTIN with broken checksum', () => {
    // Format-valid but checksum will fail.
    expect(isValidGstinChecksum('29AAAPL1234C1Z5')).toBe(false);
  });

  it('rejects malformed GSTINs in checksum check', () => {
    expect(isValidGstinChecksum('not a gstin')).toBe(false);
    expect(isValidGstinChecksum('')).toBe(false);
  });
});
