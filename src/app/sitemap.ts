import type { MetadataRoute } from 'next';
import { env } from '@/env';
import { db } from '@/server/db';

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // You can fetch dynamic routes here if needed
  const activeCompetitions = await db.competition.findMany({});
  return [
    {
      url: env.HOST,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...activeCompetitions.map((competition) => ({
      url: `${env.HOST}/competitions/${competition.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    {
      url: `${env.HOST}/feed`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${env.HOST}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // Add more static routes as needed
  ];
}
