/**
 * Allow-listed Geoapify categories. Surfacing only these in the UI keeps the
 * data layer focused on commercial B2B-relevant verticals and avoids categories
 * with high PII risk (`tourism.attraction`, `internet_access`, etc.).
 */

export const CATEGORIES = [
  { id: 'catering.restaurant', label: 'Restaurants' },
  { id: 'catering.cafe', label: 'Cafés' },
  { id: 'catering.bar', label: 'Bars / Pubs' },
  { id: 'catering.fast_food', label: 'Fast food' },
  { id: 'commercial.shopping_mall', label: 'Shopping malls' },
  { id: 'commercial.supermarket', label: 'Supermarkets' },
  { id: 'commercial.electronics', label: 'Electronics retailers' },
  { id: 'commercial.clothing', label: 'Clothing retailers' },
  { id: 'service.financial', label: 'Financial services' },
  { id: 'service.beauty', label: 'Beauty / Salon' },
  { id: 'service.cleaning', label: 'Cleaning services' },
  { id: 'service.repair', label: 'Repair services' },
  { id: 'healthcare.clinic_or_praxis', label: 'Clinics' },
  { id: 'healthcare.dentist', label: 'Dental clinics' },
  { id: 'healthcare.pharmacy', label: 'Pharmacies' },
  { id: 'accommodation.hotel', label: 'Hotels' },
  { id: 'accommodation.hostel', label: 'Hostels' },
  { id: 'education.school', label: 'Schools' },
  { id: 'education.driving_school', label: 'Driving schools' },
  { id: 'education.language_school', label: 'Language schools' },
  { id: 'office.company', label: 'Offices / Companies' },
  { id: 'office.coworking', label: 'Coworking spaces' },
  { id: 'sport.fitness', label: 'Gyms / Fitness' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((c) => c.id);

export function isAllowedCategory(id: string): id is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(id);
}
