import { describe, expect, it } from 'vitest';
import { formatDate, formatPaise, formatPhoneIN, isValidIndianMobile, toE164 } from './intl';

describe('formatPaise', () => {
  it('formats paise as INR with Indian grouping', () => {
    expect(formatPaise(99_900)).toMatch(/₹\s*999/);
    expect(formatPaise(1_00_00_000)).toMatch(/₹\s*1,00,000/);
  });

  it('includes paise precision when requested', () => {
    expect(formatPaise(117_882, { withPaise: true })).toMatch(/₹\s*1,178\.82/);
  });
});

describe('formatPhoneIN', () => {
  it('formats E.164 to spaced international', () => {
    expect(formatPhoneIN('+919999999999')).toBe('+91 99999 99999');
  });
});

describe('isValidIndianMobile', () => {
  it('accepts valid Indian mobiles', () => {
    expect(isValidIndianMobile('+919999999999')).toBe(true);
    expect(isValidIndianMobile('+918888888888')).toBe(true);
  });

  it('rejects invalid mobiles', () => {
    expect(isValidIndianMobile('+91123')).toBe(false);
    expect(isValidIndianMobile('+12025550100')).toBe(false);
  });
});

describe('toE164', () => {
  it('returns E.164 for various Indian inputs', () => {
    expect(toE164('9999999999')).toBe('+919999999999');
    expect(toE164('+91 9999 999999')).toBe('+919999999999');
  });

  it('throws on invalid', () => {
    expect(() => toE164('abc')).toThrow();
  });
});

describe('formatDate', () => {
  it('formats DD/MM/YYYY-style', () => {
    expect(formatDate('2026-04-12T00:00:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
