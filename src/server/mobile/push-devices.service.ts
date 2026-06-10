import { z } from 'zod';

import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import { isValidPushTokenForPlatform } from '@/server/mobile/push-token-validation';

const pushTokenRefine = (
  data: { token: string; platform: 'android' | 'ios' },
  ctx: z.RefinementCtx,
) => {
  if (!isValidPushTokenForPlatform(data.token, data.platform)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        data.platform === 'ios'
          ? 'Invalid push token (expected APNs, FCM, or OneSignal subscription id)'
          : 'Invalid push token (expected FCM or OneSignal subscription id)',
      path: ['token'],
    });
  }
};

export const upsertPushDeviceSchema = z
  .object({
    token: z.string().min(1).max(512),
    platform: z.enum(['android', 'ios']),
    apnsEnvironment: z.enum(['sandbox', 'production']).optional(),
  })
  .superRefine(pushTokenRefine);

export type UpsertPushDeviceInput = z.infer<typeof upsertPushDeviceSchema>;

export async function upsertUserPushDevice(input: UpsertPushDeviceInput): Promise<void> {
  const { userId } = await requireMobileSession('userId');
  await db.userPushDevice.upsert({
    where: { token: input.token },
    create: {
      userId,
      token: input.token,
      platform: input.platform,
      apnsEnvironment:
        input.platform === 'ios' ? (input.apnsEnvironment ?? null) : null,
    },
    update: {
      userId,
      platform: input.platform,
      apnsEnvironment:
        input.platform === 'ios' ? (input.apnsEnvironment ?? null) : null,
    },
  });
}

export async function deleteUserPushDeviceByToken(token: string): Promise<void> {
  const { userId } = await requireMobileSession('userId');
  await db.userPushDevice.deleteMany({
    where: {
      userId,
      token,
    },
  });
}

export async function getUserPushDeviceStatus(): Promise<{
  deviceCount: number;
  platforms: Array<'android' | 'ios'>;
}> {
  const { userId } = await requireMobileSession('userId');
  const devices = await db.userPushDevice.findMany({
    where: { userId },
    select: { platform: true },
  });
  return {
    deviceCount: devices.length,
    platforms: [...new Set(devices.map((d) => d.platform))],
  };
}
