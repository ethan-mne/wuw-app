import { z } from 'zod';
import { sendOTPmail } from '@/app/[locale]/(auth)/login/actions';
import { db } from '@/server/db';

export const sendOtpSchema = z.object({
  email: z.string().email(),
});

export const checkOtpSchema = z.object({
  otpId: z.string().min(1),
});

export async function sendMobileOtp(email: string) {
  return sendOTPmail(email);
}

export async function isMobileOtpValid(otpId: string) {
  const otp = await db.oTP.findFirst({
    where: {
      id: otpId,
      used: false,
      expires: {
        gte: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(otp);
}
