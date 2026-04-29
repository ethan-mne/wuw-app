'use server';

import type { CompetitionResponse } from '@/lib/interfaces';
import type { CompetitionStatus } from '@prisma/client';
import { db as prisma } from '@/server/db';

export async function getCompetitions({
  input,
}: {
  input: { ids?: string[]; status: CompetitionStatus };
}): Promise<CompetitionResponse> {
  try {
    const competitions = await prisma.competition.findMany({
      where: {
        id: {
          in: input.ids,
        },
        status: input.status,
      },
      select: {
        id: true,
        total_tickets: true,
        name: true,
        end_date: true,
        price: true,
        ticket_price: true,
        remaining_tickets: true,
        status: true,
        max_winners: true,
        cash_alternative: true,
        Watches: {
          include: {
            images_url: true,
          },
        },
        _count: {
          select: {
            Ticket: true,
          },
        },
      },
    });
    return { data: competitions };
  } catch (error) {
    return { data: [], error };
  }
}
