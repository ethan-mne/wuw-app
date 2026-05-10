import { OTPEmail } from '@/components/emails/otpEmail';
import { db } from '@/server/db';
import { resend } from '@/lib/resend';
import { cookies } from 'next/headers';
import { faker } from '@faker-js/faker';
import { z } from 'zod';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const PREVIOUS_ACTIVE_OTP_LIMIT = 1;

const emailSchema = z.string().trim().min(1).email();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const generateOTPCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

type SendOTPErrorCode = 'invalid_email' | 'rate_limited' | 'unexpected';

export type SendOTPResult =
  | {
      status: 'sent';
      otpID: string;
    }
  | {
      status: 'error';
      code: SendOTPErrorCode;
      retryAfterSeconds?: number;
    };

export const sendOTPmail = async (email: string): Promise<SendOTPResult> => {
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return {
      status: 'error',
      code: 'invalid_email',
    };
  }

  const normalizedEmail = normalizeEmail(parsedEmail.data);

  try {
    const user = await db.user.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        utm: cookies().get('utm')?.value,
      },
      select: { id: true },
    });

    await db.referrals.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        code: faker.string.alphanumeric(8),
        discount_rate: 0.1,
        usage_counter: 0,
        user_id: user.id,
      },
    });

    const now = new Date();
    const latestActiveOTP = await db.oTP.findFirst({
      where: {
        userID: user.id,
        used: false,
        expires: {
          gte: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (latestActiveOTP) {
      const elapsedMs = now.getTime() - latestActiveOTP.createdAt.getTime();
      const remainingMs = OTP_COOLDOWN_MS - elapsedMs;
      if (remainingMs > 0) {
        return {
          status: 'error',
          code: 'rate_limited',
          retryAfterSeconds: Math.ceil(remainingMs / 1000),
        };
      }
    }

    const activeOTPsToInvalidate = await db.oTP.findMany({
      where: {
        userID: user.id,
        used: false,
        expires: {
          gte: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: PREVIOUS_ACTIVE_OTP_LIMIT,
      select: {
        id: true,
      },
    });

    if (activeOTPsToInvalidate.length > 0) {
      await db.oTP.updateMany({
        where: {
          id: {
            in: activeOTPsToInvalidate.map((activeOTP) => activeOTP.id),
          },
        },
        data: {
          used: true,
        },
      });
    }

    const otp = await db.oTP.create({
      data: {
        userID: user.id,
        otp: generateOTPCode(),
        expires: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    try {
      await resend.emails.send({
        from: 'noreply@winuwatch.uk',
        to: normalizedEmail,
        subject: 'Your authentication code',
        react: OTPEmail({ validationCode: otp.otp }),
      });
    } catch {
      await db.oTP.update({
        where: { id: otp.id },
        data: { used: true },
      });

      return {
        status: 'error',
        code: 'unexpected',
      };
    }

    return {
      status: 'sent',
      otpID: otp.id,
    };
  } catch (error) {
    console.error('Failed to send OTP email', error);
    return {
      status: 'error',
      code: 'unexpected',
    };
  }
};
