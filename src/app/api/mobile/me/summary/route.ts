import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { getServerAuthSession } from '@/server/auth';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user, referral, activeTickets] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        wincoin: true,
      },
    }),
    db.referrals.findUnique({
      where: { user_id: session.user.id },
      select: { code: true },
    }),
    db.ticket.count({
      where: {
        Order: {
          email: session.user.email ?? '',
          status: 'CONFIRMED',
        },
      },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      userName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'User',
      email: user.email,
      points: user.wincoin,
      activeTickets,
      referralCode: referral?.code ?? '',
    },
  });
}
