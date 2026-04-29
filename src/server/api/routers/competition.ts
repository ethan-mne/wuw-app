import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { z } from 'zod';

export const newCompetitionRouter = createTRPCRouter({
  getCompetition: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const competition = await ctx.prisma.competition.findUnique({
        where: {
          id: input,
        },
        include: {
          Watches: {
            include: {
              images_url: {
                select: {
                  url: true,
                },
              },
            },
          },
          _count: {
            select: {
              Ticket: {
                where: {
                  Order: {
                    status: 'CONFIRMED',
                  },
                },
              },
            },
          },
        },
      });

      if (!competition) {
        return null;
      }

      return {
        session: ctx.session,
        competition: {
          ...competition,
          remaining_tickets: Math.max(
            competition.total_tickets - competition._count.Ticket,
            0,
          ),
        },
      };
    }),
});
