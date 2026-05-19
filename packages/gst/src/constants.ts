/** SaaS HSN/SAC — Information technology consulting & support services. */
export const SAC_SAAS = '998314' as const;

/** GST rate for SaaS — 18%. Stored as basis points to avoid float drift. */
export const GST_RATE_BPS = 1800 as const;

/** Indian state codes per GST schema. Keep alphabetical-name order in maps. */
export const STATE_CODES = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
} as const satisfies Record<string, string>;

export type StateCode = keyof typeof STATE_CODES;

export function isValidStateCode(code: string): code is StateCode {
  return code in STATE_CODES;
}

/** Match GST e-invoicing applicability threshold (₹5Cr from Aug 2023). */
export const IRN_TURNOVER_THRESHOLD_PAISE = 50_000_000_00;
