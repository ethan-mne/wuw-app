import { z } from 'zod';
import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import { MobileHttpError } from '@/server/mobile/http';
import type {
  MobileAccountSummary,
  MobileActiveEntryItem,
  MobileProfileUpdateInput,
} from '@/server/mobile/types';

const mobileProfileSelect = {
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  country: true,
  zipCode: true,
  address: true,
  city: true,
  image: true,
  emailVerified: true,
  is_admin: true,
} as const;

export type MobileProfileDto = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  zipCode: string | null;
  address: string | null;
  city: string | null;
  image: string | null;
  emailVerified: Date | null;
  isAdmin: boolean;
};

export const mobileProfileUpdateSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  country: z.string(),
  zip: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
});

export async function getMobileProfile(): Promise<MobileProfileDto> {
  const { userId } = await requireMobileSession('userId');
  const user = await db.user.findUnique({
    where: { id: userId },
    select: mobileProfileSelect,
  });
  if (!user) {
    throw new MobileHttpError('User not found', 404);
  }
  return {
    ...user,
    isAdmin: user.is_admin,
  };
}

export async function updateMobileProfile(input: MobileProfileUpdateInput): Promise<MobileProfileDto> {
  const { userId } = await requireMobileSession('userId');
  const user = await db.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstname,
      lastName: input.lastname,
      email: input.email,
      phone: input.phone,
      zipCode: input.zip,
      address: input.address,
      city: input.city,
      country: input.country,
    },
    select: mobileProfileSelect,
  });
  return {
    ...user,
    isAdmin: user.is_admin,
  };
}

export async function getMobileAccountSummary(): Promise<MobileAccountSummary> {
  const { userId, email } = await requireMobileSession('userId');

  const [user, referral, activeTickets] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        wincoin: true,
      },
    }),
    db.referrals.findUnique({
      where: { user_id: userId },
      select: { code: true },
    }),
    db.ticket.count({
      where: {
        Order: {
          email: email ?? '',
          status: 'CONFIRMED',
        },
      },
    }),
  ]);

  if (!user) {
    throw new MobileHttpError('User not found', 404);
  }

  return {
    userName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'User',
    email: user.email,
    points: user.wincoin,
    activeTickets,
    referralCode: referral?.code ?? '',
  };
}

export async function listMobileActiveEntries(): Promise<MobileActiveEntryItem[]> {
  const { email } = await requireMobileSession('email');
  if (!email) {
    return [];
  }

  const now = new Date();
  const groupedTickets = await db.ticket.groupBy({
    by: ['competitionId'],
    where: {
      Order: {
        email,
        status: 'CONFIRMED',
      },
      Competition: {
        status: 'ACTIVE',
        drawing_date: { gt: now },
      },
    },
    _count: {
      _all: true,
    },
  });

  const competitionIds = groupedTickets
    .map((row) => row.competitionId.trim())
    .filter((id): id is string => id.length > 0);
  if (competitionIds.length === 0) {
    return [];
  }

  const competitions = await db.competition.findMany({
    where: {
      id: { in: competitionIds },
      status: 'ACTIVE',
      drawing_date: { gt: now },
    },
    select: {
      id: true,
      name: true,
      comp_image_url: true,
      drawing_date: true,
      Watches: {
        select: {
          images_url: {
            take: 1,
            select: {
              url: true,
            },
          },
        },
      },
    },
  });

  const competitionById = new Map(
    competitions.map((competition) => [competition.id, competition]),
  );

  return groupedTickets
    .map((row) => {
      const competitionId = row.competitionId.trim();
      const competition = competitionById.get(competitionId);
      if (!competition) {
        return null;
      }
      const watchImageUrl = competition.Watches?.images_url[0]?.url?.trim();
      const competitionImageUrl =
        competition.comp_image_url?.trim() || watchImageUrl || null;
      return {
        competitionId,
        competitionName: competition.name,
        competitionImageUrl,
        drawingDate: competition.drawing_date.toISOString(),
        ticketCount: row._count._all,
      };
    })
    .filter((entry): entry is MobileActiveEntryItem => entry !== null)
    .sort((a, b) => new Date(a.drawingDate).getTime() - new Date(b.drawingDate).getTime());
}
