import { z } from 'zod';

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
export const otherRouter = createTRPCRouter({
  instagram: createTRPCRouter({
    get: publicProcedure.query(async ({ ctx }) => {
      const data = await ctx.prisma.globalSettings.findUnique({
        where: {
          key: 'insta_followers',
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
      return data.value ?? '';
    }),
    update: protectedProcedure.input(z.string()).mutation(({ input, ctx }) =>
      ctx.prisma.globalSettings.update({
        where: {
          key: 'insta_followers',
        },
        data: {
          value: input,
        },
      }),
    ),
  }),
});
