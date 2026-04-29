import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { winnerSchema } from '@/lib/zodSchemas/otherSchemas';
import type { Winner } from '@prisma/client';
import { formatPrice } from '@/lib/formaters';

export const AmountWon = createTRPCRouter({
  get: publicProcedure.input(z.any()).query(async ({ ctx }) => {
    const data = await ctx.prisma.globalSettings.findUnique({
      where: {
        key: 'last_won_amount',
      },
      select: {
        value: true,
      },
    });
    if (!data) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'No data found',
      });
    }
    return data.value === null ? 0 : parseInt(data.value);
  }),
  update: protectedProcedure.input(z.number()).mutation(({ input, ctx }) =>
    ctx.prisma.globalSettings.update({
      where: {
        key: 'last_won_amount',
      },
      data: {
        value: input.toString(),
      },
    }),
  ),
});

export const winners = createTRPCRouter({
  // the filter doesnt work for videos
  winnerGrouped: publicProcedure
    .input(
      z
        .object({
          take: z.number().optional(),
          videoFilter: z.boolean().default(false),
          imageFilter: z.boolean().default(false),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const data = await ctx.prisma.winner.findMany({
        // When imageFilter is on, apply the where clause at DB level so
        // `take` counts only winners that will actually be returned.
        where: input?.imageFilter ? { img: { not: null } } : undefined,
        take: input?.take,
        orderBy: {
          date: 'desc',
        },
      });
      return data.reduce<
        Array<
          | (Omit<Winner, 'value' | 'date' | 'watch_name'> & {
              value: string;
              date: string;
              watch: string;
            })
          | {
              src: string;
            }
        >
      >((acc, item) => {
        if (item.src !== null && input?.videoFilter === false) {
          acc.push({
            src: item.src,
          });
        }
        if (input?.imageFilter && item.img === null) return acc;
        acc.push({
          ...item,
          img: item.img ?? null,
          name: item.name ?? '',
          value: formatPrice(item.value ?? 0),
          watch: item.watch_name ?? '',
          date: (item.date ?? new Date()).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
        });
        return acc;
      }, []);
    }),
  getTicket: protectedProcedure.input(z.string()).mutation(({ input, ctx }) =>
    ctx.prisma.ticket.findFirst({
      where: {
        id: input,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        Order: true,
        Competition: true,
      },
    }),
  ),

  get: protectedProcedure.input(z.number().optional()).query(({ input, ctx }) =>
    ctx.prisma.winner.findMany({
      take: input,
      orderBy: {
        date: 'desc',
      },
    }),
  ),

  add: protectedProcedure
    .input(
      winnerSchema.extend({
        order_id: z.string().nullable(),
      }),
    )
    .mutation(({ input, ctx }) => {
      const { order_id, ...data } = input;
      return Promise.all([
        ctx.prisma.winner.create({
          data,
        }),
        order_id !== null
          ? ctx.prisma.order.update({
              data: {
                challenge_answer: true,
              },
              where: {
                id: order_id,
              },
            })
          : Promise.resolve(),
      ]);
    }),
  update: protectedProcedure
    .input(
      winnerSchema
        .omit({
          id: true,
        })
        .extend({
          id: z.number(),
        }),
    )
    .mutation(({ input, ctx }) =>
      ctx.prisma.winner.update({
        where: {
          id: input.id,
        },
        data: input,
      }),
    ),
  delete: protectedProcedure.input(z.number()).mutation(({ input, ctx }) =>
    ctx.prisma.winner.delete({
      where: {
        id: input,
      },
    }),
  ),
});
