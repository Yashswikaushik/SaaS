import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bharatleads.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/app/', '/api/', '/admin/'] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
