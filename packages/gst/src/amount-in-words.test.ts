import { describe, expect, it } from 'vitest';
import { amountInWords } from './amount-in-words';

describe('amountInWords', () => {
  it('handles zero', () => {
    expect(amountInWords(0)).toBe('Zero Rupees Only');
  });

  it('handles round rupees', () => {
    expect(amountInWords(100)).toBe('One Rupees Only');
    expect(amountInWords(1_00_000)).toBe('One Thousand Rupees Only');
    expect(amountInWords(1_00_00_000)).toBe('One Lakh Rupees Only');
    expect(amountInWords(1_00_00_00_000)).toBe('One Crore Rupees Only');
  });

  it('handles rupees + paise', () => {
    expect(amountInWords(117_882)).toBe(
      'One Thousand One Hundred Seventy Eight Rupees and Eighty Two Paise Only',
    );
  });

  it('rejects negatives', () => {
    expect(() => amountInWords(-1)).toThrow();
  });
});
