import { z } from 'zod';
import { sendOTPmail } from '@/server/auth/send-otp-mail';
import { db } from '@/server/db';
import { isValidOtpCode } from '@/server/otp-auth';

export const sendOtpSchema = z.object({
  email: z.string().email(),
});

export const checkOtpSchema = z.object({
  otpId: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  otpId: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/),
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

/** Validates code, marks OTP used, returns user or null. */
export async function consumeMobileOtp(otpId: string, otp: string) {
  if (!isValidOtpCode(otp)) {
    return null;
  }

  const record = await db.oTP.findFirst({
    where: {
      id: otpId,
      otp,
      used: false,
      expires: {
        gte: new Date(),
      },
    },
    select: {
      id: true,
      userID: true,
    },
  });

  if (!record) {
    return null;
  }

  await db.oTP.update({
    where: { id: record.id },
    data: { used: true },
  });

  const user = await db.user.findUnique({
    where: { id: record.userID },
    select: {
      id: true,
      email: true,
    },
  });

  return user;
}
