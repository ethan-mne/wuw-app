import type { MetadataRoute } from 'next';
import { env } from '@/env';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/private/'],
      },
    ],
    sitemap: `${env.HOST}/sitemap.xml`,
    host: env.HOST,
  };
}
