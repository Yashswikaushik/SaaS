/**
 * Convert a paise amount into Indian-English words (Rupees and Paise).
 * Required for GST invoices by Rule 46(c).
 *
 * Examples:
 *   1_00_000_00 → "One Lakh Rupees Only"
 *   1_178_82    → "One Thousand One Hundred Seventy Eight Rupees and Eighty Two Paise"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n] ?? '';
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? TENS[t]! : `${TENS[t]} ${ONES[o]}`;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h === 0) return twoDigits(r);
  return r === 0 ? `${ONES[h]} Hundred` : `${ONES[h]} Hundred ${twoDigits(r)}`;
}

function inWordsRupees(rupees: number): string {
  if (rupees === 0) return 'Zero';
  const crore = Math.floor(rupees / 1_00_00_000);
  const lakh = Math.floor((rupees % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((rupees % 1_00_000) / 1_000);
  const rest = rupees % 1_000;
  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(' ').trim();
}

export function amountInWords(totalPaise: number): string {
  if (!Number.isInteger(totalPaise) || totalPaise < 0) {
    throw new Error('amountInWords expects non-negative integer paise');
  }
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  if (paise === 0) return `${inWordsRupees(rupees)} Rupees Only`;
  return `${inWordsRupees(rupees)} Rupees and ${twoDigits(paise)} Paise Only`;
}
