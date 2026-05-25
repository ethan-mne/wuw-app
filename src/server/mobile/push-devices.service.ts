import { z } from 'zod';

import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import { isLikelyFcmRegistrationToken } from '@/server/mobile/push-token-validation';

export const upsertPushDeviceSchema = z.object({
  token: z
    .string()
    .min(1)
    .max(512)
    .refine(isLikelyFcmRegistrationToken, {
      message:
        'Invalid FCM token (iOS must use FCM.getToken(), not the APNs token from PushNotifications registration)',
    }),
  platform: z.enum(['android', 'ios']),
});

export type UpsertPushDeviceInput = z.infer<typeof upsertPushDeviceSchema>;

export async function upsertUserPushDevice(input: UpsertPushDeviceInput): Promise<void> {
  const { userId } = await requireMobileSession('userId');
  await db.userPushDevice.upsert({
    where: { token: input.token },
    create: {
      userId,
      token: input.token,
      platform: input.platform,
    },
    update: {
      userId,
      platform: input.platform,
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
