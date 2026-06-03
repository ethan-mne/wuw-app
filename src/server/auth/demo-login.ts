import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { env } from '@/env';
import { signMobileSessionToken } from '@/server/mobile/mobile-session-token';
import { db } from '@/server/db';

const emailSchema = z.string().trim().min(1).email();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function ensureDemoUser(email: string): Promise<{ id: string; email: string | null }> {
  const rawUtm = cookies().get('utm')?.value?.trim();
  const utm = rawUtm && rawUtm.length > 0 ? rawUtm : null;
  const existing = await db.$queryRaw<{ id: string; email: string | null }[]>`
    SELECT id, email
    FROM \`User\`
    WHERE email = ${email}
    LIMIT 1
  `;
  if (existing[0]) {
    return existing[0];
  }

  const id = randomUUID();
  try {
    if (utm) {
      await db.$executeRaw`
        INSERT INTO \`User\` (id, email, utm)
        VALUES (${id}, ${email}, ${utm})
      `;
    } else {
      await db.$executeRaw`
        INSERT INTO \`User\` (id, email)
        VALUES (${id}, ${email})
      `;
    }
  } catch {
    const createdByRace = await db.$queryRaw<{ id: string; email: string | null }[]>`
      SELECT id, email
      FROM \`User\`
      WHERE email = ${email}
      LIMIT 1
    `;
    if (createdByRace[0]) {
      return createdByRace[0];
    }
    throw new Error('Failed to create demo user record.');
  }

  return { id, email };
}

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
    const user = await ensureDemoUser(normalizedEmail);

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
