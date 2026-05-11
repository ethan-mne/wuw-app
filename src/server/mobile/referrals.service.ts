import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import type { MobileReferralUsageItem } from '@/server/mobile/types';

/**
 * Referrer Wincoins shown per usage until a dedicated ledger exists.
 * Buyer accrual uses the same per-ticket amount in payment webhooks.
 */
const REFERRER_WINCOINS_PER_TICKET = 10;

export async function listMobileReferralUsages(): Promise<MobileReferralUsageItem[]> {
  const { userId, email: referrerEmail } = await requireMobileSession('email');

  const referral = await db.referrals.findUnique({
    where: { user_id: userId },
    select: { code: true },
  });

  if (!referral?.code) {
    return [];
  }

  const orders = await db.order.findMany({
    where: {
      coupon: referral.code,
      status: 'CONFIRMED',
      ...(referrerEmail ? { email: { not: referrerEmail } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      first_name: true,
      last_name: true,
      email: true,
      createdAt: true,
      Ticket: {
        take: 1,
        select: {
          Competition: {
            select: { name: true },
          },
        },
      },
      _count: {
        select: { Ticket: true },
      },
    },
  });

  return orders.map((order) => {
    const full = [order.first_name, order.last_name].filter(Boolean).join(' ').trim();
    const compName = order.Ticket[0]?.Competition?.name?.trim();
    return {
      customerName: full || order.email || 'Customer',
      usedAt: order.createdAt.toISOString(),
      competitionName: compName && compName.length > 0 ? compName : '—',
      wincoinsEarned: order._count.Ticket * REFERRER_WINCOINS_PER_TICKET,
    };
  });
}
