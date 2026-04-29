'use server';

import { db as prisma } from '@/server/db';
export async function getCompetitionById(id: string) {
  try {
    const competition = await prisma.$transaction([
      prisma.competition.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          _count: {
            select: {
              Ticket: true,
            },
          },
        },
      }),
      prisma.competition.findUnique({
        where: {
          id,
        },
        include: {
          Watches: {
            include: {
              images_url: true,
            },
          },
        },
      }),
    ]);
    return competition;
  } catch (error) {
    return { error };
  }
}
