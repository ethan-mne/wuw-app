import { cookies } from 'next/headers';
import { faker } from '@faker-js/faker';
import { z } from 'zod';

import { env } from '@/env';
import { signMobileSessionToken } from '@/server/mobile/mobile-session-token';
import { db } from '@/server/db';

const emailSchema = z.string().trim().min(1).email();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export type DemoLoginResult =
  | { status: 'ok'; token: string }
  | { status: 'error'; code: 'disabled' | 'invalid_email' | 'unexpected' };

export async function loginWithDemoEmail(email: string): Promise<DemoLoginResult> {
  if (env.DEMO_AUTH_ENABLED !== 'true') {
    return { status: 'error', code: 'disabled' };
  }

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return { status: 'error', code: 'invalid_email' };
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
      select: { id: true, email: true },
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

    const token = await signMobileSessionToken(user.id, user.email ?? null);
    return { status: 'ok', token };
  } catch (error) {
    console.error('Demo login failed', error);
    return { status: 'error', code: 'unexpected' };
  }
}
