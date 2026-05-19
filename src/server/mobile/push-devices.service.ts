import { z } from 'zod';

import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';

export const upsertPushDeviceSchema = z.object({
  token: z.string().min(1).max(512),
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
