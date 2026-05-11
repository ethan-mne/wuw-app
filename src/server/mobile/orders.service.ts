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
          Competition: {
            select: {
              name: true,
              comp_image_url: true,
            },
          },
        },
      },
      _count: {
        select: {
          Ticket: true,
        },
      },
      coupon: true,
      createdAt: true,
    },
  });

  return orders.map((order) => {
    const ticket = order.Ticket[0];
    const competition = ticket?.Competition;
    return {
      id: order.id,
      competitionId: ticket?.competitionId ?? '',
      competitionName: competition?.name ?? '',
      competitionImageUrl: competition?.comp_image_url ?? null,
      ticketQuantity: order._count.Ticket,
      ticketPrice: ticket?.ticketPrice ?? 0,
      couponCode: order.coupon ?? undefined,
      orderedAt: order.createdAt.toISOString(),
    };
  });
}
