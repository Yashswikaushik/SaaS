import { z } from 'zod';
import { isAllowedCategory, type CategoryId } from './categories';

const BASE = 'https://api.geoapify.com';
const REQUEST_TIMEOUT_MS = 15_000;

function apiKey(): string {
  const k = process.env.GEOAPIFY_API_KEY;
  if (!k) throw new Error('GEOAPIFY_API_KEY env var is required');
  return k;
}

const PlaceFeature = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z
    .object({
      place_id: z.string().optional(),
      name: z.string().optional(),
      country: z.string().optional(),
      country_code: z.string().optional(),
      state: z.string().optional(),
      state_code: z.string().optional(),
      city: z.string().optional(),
      postcode: z.string().optional(),
      address_line1: z.string().optional(),
      address_line2: z.string().optional(),
      formatted: z.string().optional(),
      categories: z.array(z.string()).optional(),
      website: z.string().optional(),
      contact: z
        .object({
          phone: z.string().optional(),
          email: z.string().optional(),
        })
        .partial()
        .optional(),
      datasource: z.object({ raw: z.record(z.unknown()).optional() }).partial().optional(),
      datasource_id: z.string().optional(),
    })
    .passthrough(),
});

const PlacesResponse = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(PlaceFeature),
});

export interface SearchInPolygonInput {
  /** GeoJSON polygon coordinates: ring of [lng,lat] pairs. */
  polygon: Array<[number, number]>;
  categories: CategoryId[];
  /** Max results. Geoapify caps at 500 per call. */
  limit?: number;
  /** Bias for India only. */
  countryFilter?: string;
}

export interface NormalizedPlace {
  externalId: string;
  businessName: string;
  category: string;
  lat: number;
  lng: number;
  addressFormatted?: string;
  city?: string;
  state?: string;
  pincode?: string;
  countryCode: string;
  website?: string;
  phone?: string;
  email?: string;
  sourceUrl: string;
}

export async function searchInPolygon(input: SearchInPolygonInput): Promise<NormalizedPlace[]> {
  const ok = input.categories.every(isAllowedCategory);
  if (!ok) throw new Error('One or more categories are not in the allow-list');
  if (input.polygon.length < 3) throw new Error('Polygon must have at least 3 vertices');
  if ((input.limit ?? 0) > 500) throw new Error('limit must be <= 500');

  const wkt = polygonToWkt(input.polygon);
  const url = new URL(`${BASE}/v2/places`);
  url.searchParams.set('categories', input.categories.join(','));
  url.searchParams.set('filter', `geometry:${wkt}`);
  url.searchParams.set('limit', String(input.limit ?? 100));
  url.searchParams.set('apiKey', apiKey());
  if (input.countryFilter !== 'none') {
    url.searchParams.set('bias', 'countrycode:in');
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BharatLeads/1.0 (+contact: hello@bharatleads.in)' },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`Geoapify ${res.status}: ${await res.text()}`);
    }
    const parsed = PlacesResponse.parse(await res.json());
    return parsed.features
      .map(normalize)
      .filter((p): p is NormalizedPlace => p !== null);
  } finally {
    clearTimeout(t);
  }
}

function normalize(f: z.infer<typeof PlaceFeature>): NormalizedPlace | null {
  const p = f.properties;
  if (!p.place_id || !p.name) return null;
  const [lng, lat] = f.geometry.coordinates;
  return {
    externalId: p.place_id,
    businessName: p.name,
    category: p.categories?.[0] ?? '',
    lat,
    lng,
    addressFormatted: p.formatted,
    city: p.city,
    state: p.state,
    pincode: p.postcode,
    countryCode: (p.country_code ?? 'in').toUpperCase(),
    website: p.website,
    phone: p.contact?.phone,
    email: p.contact?.email,
    /** Source URL: Geoapify deeplink for traceability. */
    sourceUrl: `https://www.geoapify.com/places/${encodeURIComponent(p.place_id)}`,
  };
}

function polygonToWkt(points: Array<[number, number]>): string {
  const ring = points.map(([lng, lat]) => `${lng} ${lat}`);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first !== last) ring.push(first ?? '');
  return `polygon:${ring.join(',')}`;
}
