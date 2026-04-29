'use server';
import { resend } from '@/lib/resend';
import { ConfirmationEmail } from '@/components/emails/confirmation-email';
import { GiftTicketEmail } from '@/components/emails/gift-ticket-email';
import type { CompetitionInterface } from './interfaces';
import { api } from '@/trpc/server';
import type { gift, order_paymentMethod } from '@prisma/client';

export async function sendConfirmationEmail({
  identifier,
  order_id,
  competition,
  buyer_name,
  gift,
  isFree,
  paymentMethod,
}: {
  identifier: string;
  order_id: string;
  competition: CompetitionInterface;
  buyer_name: string;
  gift?: Partial<gift>;
  provider?: string;
  theme?: string;
  isFree?: boolean;
  paymentMethod?: order_paymentMethod;
}) {
  try {
    // get ticket list based on order id
    const [user_voucher, tickets] = await Promise.all([
      api.Referal.getCouponByEmail.query(identifier),
      api.Tickets.getTicketsByOrderId.query(order_id),
    ]);
    if (tickets.length > 0) {
      console.log('sending confirtmation email');
      const data = await resend.emails.send({
        from: 'noreply@winuwatch.uk',
        to: [identifier],
        subject: isFree
          ? 'Free Tickets - WINUWATCH'
          : `Confirmation Email: WINUWATCH ORDER: #${order_id}`,
        react: ConfirmationEmail({
          userName: buyer_name,
          code: user_voucher, //affiliation code here
          ticketDetails: {
            competitionName: competition.name,
            competitionDate: competition.end_date,
            competitionImage: competition.Watches?.images_url[0]?.url ?? '',
            orderId: order_id,
            orderDetails: {
              quantity: tickets.length,
              ticketValue: tickets[0]?.ticketPrice ?? 0, //We already check above if tickets.length > 0
              ticketsIds: tickets.map((ticket) => ticket.id),
            },
          },
          paymentMethod,
        }),
      });
      let giftSuccess = false;
      if (gift?.email) {
        // console.log('sending gift to', gift.email);
        await resend.emails.send({
          from: 'noreply@winuwatch.uk',
          to: [gift.email],
          subject: `Confirmation Email : WINUWATCH GIFT ORDER: #${order_id}`,
          react: GiftTicketEmail({
            message: gift.message ?? '',
            userName: buyer_name,
            code: '1234', //affiliation code here
            ticketDetails: {
              competitionName: competition.name,
              competitionDate: competition.end_date,
              competitionImage: competition.Watches?.images_url[0]?.url ?? '',
              orderId: order_id,
              orderDetails: {
                quantity: tickets.length,
                ticketValue: tickets[0]?.ticketPrice ?? 0, //We already check above if tickets.length > 0
                ticketsIds: tickets.map((ticket) => ticket.id),
              },
            },
          }),
        });
        giftSuccess = true;
      }
      return { success: true, giftSuccess, data };
    } else {
      throw new Error('No tickets found,failed to send email');
    }
  } catch (error) {
    console.log('failed');
    throw new Error('Failed to send the verification Email.');
  }
}
