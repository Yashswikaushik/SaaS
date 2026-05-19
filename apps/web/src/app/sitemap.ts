import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bharatleads.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    '/',
    '/pricing',
    '/login',
    '/signup',
    '/legal/privacy',
    '/legal/terms',
    '/legal/dpa',
    '/legal/grievance',
    '/legal/cookies',
    '/vs/leadsquared',
    '/vs/kylas',
    '/vs/freshsales',
    '/vs/apollo',
    '/vs/lusha',
  ];
  return routes.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.7,
  }));
}
