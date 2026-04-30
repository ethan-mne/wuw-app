import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import {
  getCompetitionForMobileById,
  listCompetitionsForMobile,
} from '@/server/lightweight/competition/service';
import { sendOTPmail } from '@/app/[locale]/(auth)/login/actions';

const profileSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  country: z.string(),
  zip: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
});

export const lightweightRouter = createTRPCRouter({
  competitions: publicProcedure.query(async () => listCompetitionsForMobile()),
  competitionById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => getCompetitionForMobileById(input)),
  sendOtp: publicProcedure.input(z.string().email()).mutation(async ({ input }) => {
    return sendOTPmail(input);
  }),
  checkOtpById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const otp = await ctx.prisma.oTP.findFirst({
        where: {
          id: input,
          used: false,
          expires: {
            gte: new Date(),
          },
        },
      });
      return { valid: Boolean(otp) };
    }),
  currentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
    });
    return user;
  }),
  updateProfile: protectedProcedure
    .input(profileSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
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
    }),
});
