import { parsePhoneNumberFromString } from 'libphonenumber-js';

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const INR_FORMATTER_WITH_PAISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

/** Format paise → "₹1,000" or "₹1,000.00" depending on rounding need. */
export function formatPaise(paise: number, opts: { withPaise?: boolean } = {}): string {
  const rupees = paise / 100;
  return opts.withPaise ? INR_FORMATTER_WITH_PAISE.format(rupees) : INR_FORMATTER.format(rupees);
}

/** Format rupees integer → "₹1,000". */
export function formatRupees(rupees: number): string {
  return INR_FORMATTER.format(rupees);
}

/** "12-04-2026" — Indian DD-MM-YYYY. */
export function formatDate(d: Date | string | number): string {
  return DATE_FORMATTER.format(new Date(d));
}

/** "12 Apr 2026, 03:24 PM IST". */
export function formatDateTime(d: Date | string | number): string {
  return DATETIME_FORMATTER.format(new Date(d));
}

/** Display normaliser: '+919999999999' → '+91 99999 99999'. Returns the input
 *  unchanged if it can't be parsed as IN. */
export function formatPhoneIN(phone: string): string {
  const p = parsePhoneNumberFromString(phone, 'IN');
  if (!p) return phone;
  return p.formatInternational();
}

/** True if string is a valid Indian mobile (10 digits starting 6-9). */
export function isValidIndianMobile(input: string): boolean {
  const p = parsePhoneNumberFromString(input, 'IN');
  return !!p && p.isValid() && p.country === 'IN';
}

/** Storage normaliser: anything Indian → E.164 '+91…'. Throws if invalid. */
export function toE164(input: string): string {
  const p = parsePhoneNumberFromString(input, 'IN');
  if (!p || !p.isValid()) throw new Error(`Invalid Indian phone: ${input}`);
  return p.number;
}
