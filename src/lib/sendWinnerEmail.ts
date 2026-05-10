import { resend } from '@/lib/resend';
import { WinnersEmail } from '@/components/emails/winners-email';
import { getOrderData } from '@/server/order-details';
import { CompetitionStatus } from '@/lib/prisma-enums';
import lookup from 'country-code-lookup';
import { db as prisma } from '@/server/db';

export async function sendWinnerEmail({ order_id }: { order_id: string }) {
  const { order: orderDetails, comps } = await getOrderData(order_id);
  if (!orderDetails || !comps) {
    throw new Error('Invalid order details');
  }
  try {
    const countryCode = orderDetails.country
      ? lookup.byCountry(orderDetails.country)?.iso2
      : 'FR';
    const nextComp = await prisma.competition.findFirst({
      where: {
        status: CompetitionStatus.NOT_ACTIVE,
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
        comp_image_url: true,
        Watches: {
          include: {
            images_url: true,
          },
        },
        _count: {
          select: {
            Ticket: true,
          },
        },
      },
      orderBy: {
        end_date: 'desc',
      },
    });

    const data = await resend.emails.send({
      from: 'noreply@winuwatch.uk',
      to: [orderDetails.email],
      subject: 'Winner Email - Winuwatch',
      react: WinnersEmail({
        competitionName: comps[0]?.name ?? '',
        countryCode: countryCode ?? 'FR',
        liveDrawLink: 'https://instagram.com/winuwatch',
        userName: `${orderDetails.first_name} ${orderDetails.last_name}`,
        watchImage: comps[0]?.Watches?.images_url[0]?.url ?? '',
        watchName: comps[0]?.Watches?.brand + ' ' + comps[0]?.Watches?.model,
        nextWatchName:
          nextComp?.Watches?.brand + ' ' + nextComp?.Watches?.model,
        nextWatchImage: nextComp?.Watches?.images_url[0]?.url ?? '',
        nextWatchMaxTickets: nextComp?.total_tickets ?? 0,
        nextWatchValue: nextComp?.price ?? 0,
        nextWatchEntryPrice: nextComp?.ticket_price ?? 0,
      }),
    });
    return data;
  } catch (error) {
    console.log('Failed to send the winner email.', error);
    throw new Error('Failed to send the winner email.');
  }
}
