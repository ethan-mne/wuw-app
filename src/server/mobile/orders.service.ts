import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import type { MobileOrderHistoryItem } from '@/server/mobile/types';

export async function listMobileOrderHistory(): Promise<MobileOrderHistoryItem[]> {
  const { email } = await requireMobileSession('email');

  const orders = await db.order.findMany({
    where: {
      email: email!,
      status: 'CONFIRMED',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      Ticket: {
        take: 1,
        select: {
          competitionId: true,
          ticketPrice: true,
        },
      },
      _count: {
        select: {
          Ticket: true,
        },
      },
      coupon: true,
    },
  });

  return orders.map((order) => ({
    id: order.id,
    competitionId: order.Ticket[0]?.competitionId ?? '',
    ticketQuantity: order._count.Ticket,
    ticketPrice: order.Ticket[0]?.ticketPrice ?? 0,
    couponCode: order.coupon ?? undefined,
  }));
}
