import { z } from 'zod';

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

const profileSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  country: z.string(),
  zip: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  subscribe_to_newsletter: z.boolean().optional(),
  accept_terms: z.boolean().optional(),
});

export const UsersRouter = createTRPCRouter({
  checkOTP: publicProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const res = await ctx.prisma.oTP.findMany({
        where: {
          id: input,
          used: false,
          expires: {
            gte: new Date(),
          },
        },
      });
      return res.length > 0;
    }),
  CurrentUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userData = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      const refferalCode = await ctx.prisma.referrals.findUnique({
        where: {
          user_id: ctx.session.user.id,
        },
      });
      return { ...userData, refferalCode };
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong',
        cause: e,
      });
    }
  }),
  UpdateUserData: protectedProcedure
    .input(profileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.user.update({
          where: { id: ctx.session.user.id },
          data: {
            firstName: input.firstname,
            lastName: input.lastname,
            email: input.email,
            phone: input.phone,
            zipCode: input.zip,
            address: input.address,
            city: input.city,
            country: input.country,
          },
        });
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong',
          cause: e,
        });
      }
    }),

  checkEmailExists: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.user.findUnique({
          where: {
            email: input,
          },
        });
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong',
          cause: e,
        });
      }
    }),
});
