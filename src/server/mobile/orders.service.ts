import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import type { MobileOrderHistoryItem } from '@/server/mobile/types';

function nonEmptyOrNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

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
              Watches: {
                select: {
                  images_url: {
                    select: {
                      url: true,
                    },
                    take: 1,
                  },
                },
              },
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
      totalPrice: true,
      createdAt: true,
    },
  });

  return orders.map((order) => {
    const ticket = order.Ticket[0];
    const competition = ticket?.Competition;
    const watchFallbackImage = nonEmptyOrNull(competition?.Watches?.images_url?.[0]?.url);
    const competitionImageUrl = nonEmptyOrNull(competition?.comp_image_url) ?? watchFallbackImage;
    return {
      id: order.id,
      competitionId: ticket?.competitionId ?? '',
      competitionName: competition?.name ?? '',
      competitionImageUrl,
      ticketQuantity: order._count.Ticket,
      ticketPrice: order.totalPrice === 0 ? 0 : (ticket?.ticketPrice ?? 0),
      couponCode: order.coupon ?? undefined,
      orderedAt: order.createdAt.toISOString(),
    };
  });
}
