/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc';
import type { ReferralHistoryType } from '@/lib/types';
import { order_status } from '@/lib/prisma-enums';
import { TRPCError } from '@trpc/server';

interface CouponResult {
  code: string | null;
}

export const ReferalRouter = createTRPCRouter({
  isValid: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const exists = await ctx.prisma.referrals.findUnique({
      where: {
        code: input,
      },
    });
    return !!exists;
  }),

  getCouponByEmail: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (!input)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid coupon.',
        });
      try {
        const coupon = await ctx.prisma.$queryRaw<CouponResult[]>`
      select r.code  from referrals r 
      left join User u on r.user_id = u.id 
      where u.email = ${input}
      `;
        return coupon[0] ? coupon[0].code : null;
      } catch (e) {
        console.log(e);
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid coupon.',
        });
      }
    }),
  getCoupon: publicProcedure
    .input(z.string().nullish())
    .query(async ({ ctx, input }) => {
      const coupon = await ctx.prisma.referrals.findFirst({
        where: {
          user_id: input ?? ctx.session?.user.id,
        },
      });
      return coupon;
    }),
  //Used only in checkout form
  getCouponByCode: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (input === '' || input === '4LVDX4HG')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid coupon.',
        });
      const couponWhereClause = {
        coupon: input,
        status: order_status.CONFIRMED,
        ...(ctx.session?.user.email ? { email: ctx.session.user.email } : {}),
      };

      const coupon = await ctx.prisma.referrals.findUnique({
        where: {
          code: input,
        },
      });
      if (!coupon) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid coupon.',
        });
      }

      // verify if user is logged in and wants to use his referral code
      if (ctx.session?.user.id === coupon?.user_id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cannot use your own coupon .',
        });
      }
      // check if coupon is already used
      if (ctx.session?.user.email) {
        const isCouponAlreadyUsed = await ctx.prisma.order.findFirst({
          where: couponWhereClause,
        });
        if (isCouponAlreadyUsed && ctx.session) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Coupon already used by this user',
          });
        }
      }
      return coupon;
    }),
  getReferralHistory: protectedProcedure.query(async ({ ctx }) => {
    const coupon = await ctx.prisma.referrals.findUnique({
      where: {
        user_id: ctx.session.user.id,
      },
    });
    const refHistory = await ctx.prisma.$queryRaw<ReferralHistoryType>`SELECT 
        DISTINCT
        concat(o.first_name,' ',o.last_name) as fullname,
        c.name  as comp_name,
        o.createdAt
        from \`order\` o
        LEFT JOIN tickets t on o.id = t.orderId 
        LEFT JOIN competition c on t.competitionId = c.id
        where o.coupon = ${coupon?.code}
        and o.status = 'CONFIRMED'`;

    return refHistory;
  }),
});
