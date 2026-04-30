import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { getServerAuthSession } from '@/server/auth';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await db.order.findMany({
    where: {
      email: session.user.email,
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

  return NextResponse.json({
    data: orders.map((order) => ({
      id: order.id,
      competitionId: order.Ticket[0]?.competitionId ?? '',
      ticketQuantity: order._count.Ticket,
      ticketPrice: order.Ticket[0]?.ticketPrice ?? 0,
      couponCode: order.coupon ?? undefined,
    })),
  });
}
