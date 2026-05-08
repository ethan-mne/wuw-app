import { z } from 'zod';
import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import { MobileHttpError } from '@/server/mobile/http';
import type { MobileAccountSummary, MobileProfileUpdateInput } from '@/server/mobile/types';

export const mobileProfileUpdateSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  country: z.string(),
  zip: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
});

export async function getMobileProfile() {
  const { userId } = await requireMobileSession('userId');
  return db.user.findUnique({
    where: { id: userId },
  });
}

export async function updateMobileProfile(input: MobileProfileUpdateInput) {
  const { userId } = await requireMobileSession('userId');
  return db.user.update({
    where: { id: userId },
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
}

export async function getMobileAccountSummary(): Promise<MobileAccountSummary> {
  const { userId, email } = await requireMobileSession('userId');

  const [user, referral, activeTickets] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        wincoin: true,
      },
    }),
    db.referrals.findUnique({
      where: { user_id: userId },
      select: { code: true },
    }),
    db.ticket.count({
      where: {
        Order: {
          email: email ?? '',
          status: 'CONFIRMED',
        },
      },
    }),
  ]);

  if (!user) {
    throw new MobileHttpError('User not found', 404);
  }

  return {
    userName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'User',
    email: user.email,
    points: user.wincoin,
    activeTickets,
    referralCode: referral?.code ?? '',
  };
}
