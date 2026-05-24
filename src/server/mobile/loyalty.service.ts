import { order_paymentMethod, order_status } from '@/lib/prisma-enums';
import type { CompetitionInterface } from '@/lib/interfaces';
import { sendConfirmationEmail } from '@/lib/sendConfirmationEmail';
import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import {
  isCompetitionCheapestForFreeTicket,
  resolveCheapestRedeemableCompetitionIds,
} from '@/server/mobile/free-ticket-eligibility';
import { MobileHttpError } from '@/server/mobile/http';
import type { MobileRedeemFreeTicketResult } from '@/server/mobile/types';

export const WINCOIN_FREE_TICKET_COST = 100;

const competitionSelectForEmail = {
  id: true,
  name: true,
  start_date: true,
  end_date: true,
  total_tickets: true,
  max_winners: true,
  price: true,
  ticket_price: true,
  remaining_tickets: true,
  status: true,
  comp_image_url: true,
  cash_alternative: true,
  Watches: {
    include: {
      images_url: true,
    },
  },
} as const;

function assertProfileComplete(user: {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  zipCode: string | null;
  email: string;
}) {
  const missing: string[] = [];
  if (!user.firstName?.trim()) missing.push('first name');
  if (!user.lastName?.trim()) missing.push('last name');
  if (!user.phone?.trim()) missing.push('phone');
  if (!user.address?.trim()) missing.push('address');
  if (!user.city?.trim()) missing.push('city');
  if (!user.country?.trim()) missing.push('country');
  if (!user.zipCode?.trim()) missing.push('zip code');
  if (!user.email?.trim()) missing.push('email');

  if (missing.length > 0) {
    throw new MobileHttpError(
      'Complete your profile before redeeming a free ticket.',
      400,
    );
  }
}

export async function redeemFreeTicket(
  competitionId: string,
): Promise<MobileRedeemFreeTicketResult> {
  const { userId } = await requireMobileSession('userId');
  const trimmedId = competitionId.trim();
  if (!trimmedId) {
    throw new MobileHttpError('Competition not found', 404);
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      wincoin: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      country: true,
      address: true,
      city: true,
      zipCode: true,
    },
  });

  if (!user) {
    throw new MobileHttpError('User not found', 404);
  }

  if (user.wincoin < WINCOIN_FREE_TICKET_COST) {
    throw new MobileHttpError(
      `You need ${WINCOIN_FREE_TICKET_COST} Wincoins to redeem a free ticket.`,
      400,
    );
  }

  assertProfileComplete(user);

  const now = new Date();
  const competition = await db.competition.findUnique({
    where: { id: trimmedId },
    select: competitionSelectForEmail,
  });

  if (!competition) {
    throw new MobileHttpError('Competition not found', 404);
  }

  if (competition.status !== 'ACTIVE') {
    throw new MobileHttpError('This competition is not available.', 400);
  }

  if (competition.start_date > now || competition.end_date < now) {
    throw new MobileHttpError('This competition is not available.', 400);
  }

  const cheapestEligible = await resolveCheapestRedeemableCompetitionIds(now);
  if (
    !isCompetitionCheapestForFreeTicket(
      trimmedId,
      competition.ticket_price,
      cheapestEligible,
    )
  ) {
    throw new MobileHttpError(
      'Free tickets can only be redeemed on our lowest entry-price competitions.',
      400,
    );
  }

  const buyerName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Customer';

  const { orderId } = await db.$transaction(async (tx) => {
    const wincoinUpdate = await tx.user.updateMany({
      where: {
        id: userId,
        wincoin: { gte: WINCOIN_FREE_TICKET_COST },
      },
      data: {
        wincoin: { decrement: WINCOIN_FREE_TICKET_COST },
      },
    });

    if (wincoinUpdate.count === 0) {
      throw new MobileHttpError(
        `You need ${WINCOIN_FREE_TICKET_COST} Wincoins to redeem a free ticket.`,
        400,
      );
    }

    const competitionUpdate = await tx.competition.updateMany({
      where: {
        id: trimmedId,
        status: 'ACTIVE',
        remaining_tickets: { gt: 0 },
        start_date: { lte: now },
        end_date: { gte: now },
      },
      data: {
        remaining_tickets: { decrement: 1 },
      },
    });

    if (competitionUpdate.count === 0) {
      throw new MobileHttpError('This competition is sold out.', 400);
    }

    const order = await tx.order.create({
      data: {
        first_name: user.firstName,
        last_name: user.lastName,
        country: user.country,
        address: user.address,
        town: user.city,
        zip: user.zipCode,
        phone: user.phone!,
        email: user.email,
        paymentMethod: order_paymentMethod.WINCOIN,
        checkedEmail: true,
        checkedTerms: true,
        totalPrice: 0,
        status: order_status.CONFIRMED,
        challenge_answer: true,
      },
    });

    await tx.ticket.create({
      data: {
        orderId: order.id,
        competitionId: trimmedId,
        ticketPrice: competition.ticket_price,
        reduction: 0,
        affiliation_reduction: 0,
      },
    });

    return { orderId: order.id };
  });

  const updatedUser = await db.user.findUnique({
    where: { id: userId },
    select: { wincoin: true },
  });

  try {
    await sendConfirmationEmail({
      identifier: user.email,
      order_id: orderId,
      competition: competition as CompetitionInterface,
      buyer_name: buyerName,
      isFree: true,
      paymentMethod: order_paymentMethod.WINCOIN,
    });
  } catch (error) {
    console.error('Failed to send free ticket confirmation email:', error);
  }

  return {
    orderId,
    competitionId: trimmedId,
    competitionName: competition.name,
    remainingWincoins: updatedUser?.wincoin ?? user.wincoin - WINCOIN_FREE_TICKET_COST,
  };
}
