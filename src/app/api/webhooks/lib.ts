import { db } from '@/server/db';
import type { Order } from '@prisma/client';
import { sendConfirmationEmail } from '@/lib/sendConfirmationEmail';

export async function HandelConfirmedORder(payment: Order) {
  // Find tickets
  const tickets = await db.ticket.findMany({
    where: {
      orderId: payment.id,
    },
    select: {
      competitionId: true,
      id: true,
    },
  });
  console.log('🎟️ DEBUG: Found tickets:', tickets);

  const FirstTicket = tickets[0];
  if (!FirstTicket) {
    throw new Error(`No tickets found for order: ${payment.id}`);
  }

  console.log('🎯 DEBUG: About to fetch competition and gift');
  // Get competition and gift data
  const [competition, gift] = await db.$transaction([
    db.competition.findUnique({
      where: {
        id: FirstTicket.competitionId,
      },
      select: {
        id: true,
        total_tickets: true,
        name: true,
        end_date: true,
        price: true,
        ticket_price: true,
        remaining_tickets: true,
        status: true,
        max_winners: true,
        cash_alternative: true,
        comp_image_url: true,
        Watches: {
          include: {
            images_url: true,
          },
        },
      },
    }),
    db.gift.findFirst({
      where: {
        order_id: payment.id,
      },
    }),
  ]);
  console.log('🏆 Found competition:', competition);
  console.log('🎁 Found gift:', gift);

  if (!competition) {
    throw new Error('Competition not found');
  }

  await sendConfirmationEmail({
    identifier: payment.email,
    order_id: payment.id,
    competition: competition,
    buyer_name: payment.first_name + ' ' + payment.last_name,
    gift: gift ?? undefined,
    paymentMethod: payment.paymentMethod,
  });
  console.log('📧 Sending confirmation email to:', payment.email);
  // I need to find the user and increment wincoins
  const user = await db.user.findFirst({
    select: {
      id: true,
      wincoin: true,
    },
    where: {
      email: payment.email,
    },
  });
  if (user) {
    const MAX_WINCOINS = 100;
    const WINCOINS_PER_TICKET = 10;
    if (user && user.wincoin < MAX_WINCOINS) {
      // Update the user's wincoin balance, so it does not exceed MAX_WINCOINS "100".
      const update = await db.user.update({
        data: {
          wincoin: Math.min(
            user.wincoin + tickets.length * WINCOINS_PER_TICKET,
            MAX_WINCOINS,
          ),
        },
        where: { id: user.id },
      });
      console.log('updating wincoins', update);
    }
  }

  const [order] = await db.$transaction([
    db.order.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'CONFIRMED',
      },
    }),
    // Decrement remaining tickets
    db.competition.update({
      where: {
        id: FirstTicket.competitionId,
      },
      data: {
        remaining_tickets: {
          decrement: tickets.length,
        },
      },
    }),
  ]);
  console.log('📝 Updated order:', order);
  return order;
}
