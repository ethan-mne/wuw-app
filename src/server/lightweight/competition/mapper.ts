import { CompetitionStatus } from '@/lib/prisma-enums';
import type { Competition, Watches } from '@prisma/client';

type CompetitionWithWatch = Competition & {
  Watches: (Watches & { images_url: Array<{ url: string }> }) | null;
  _count: {
    Ticket: number;
  };
};

export type MobileCompetitionDto = {
  id: string;
  name: string;
  totalTickets: number;
  remainingTickets: number;
  ticketPrice: number;
  price: number;
  cashAlternative: number | null;
  maxWinners: number;
  endDate: string;
  status: 'ACTIVE' | 'OPEN' | 'CLOSED';
  watch: {
    id: string;
    brand: string;
    model: string;
    referenceNumber: string;
    movement: string;
    braceletMaterial: string;
    yearOfManufacture: number;
    condition: string;
    hasBox: boolean;
    hasCertificate: boolean;
    images: Array<{ url: string; alt: string }>;
  };
};

function mapStatus(
  status: Competition['status'],
  remainingTickets: number,
): MobileCompetitionDto['status'] {
  if (status === CompetitionStatus.COMPLETED || remainingTickets <= 0) {
    return 'CLOSED';
  }
  if (status === CompetitionStatus.NOT_ACTIVE) {
    return 'OPEN';
  }
  return 'ACTIVE';
}

export function mapCompetitionToMobileDto(
  competition: CompetitionWithWatch,
): MobileCompetitionDto {
  const remainingTickets = Math.max(
    competition.total_tickets - competition._count.Ticket,
    0,
  );

  return {
    id: competition.id,
    name: competition.name,
    totalTickets: competition.total_tickets,
    remainingTickets,
    ticketPrice: competition.ticket_price,
    price: competition.price,
    cashAlternative: competition.cash_alternative,
    maxWinners: competition.max_winners,
    endDate: competition.end_date.toISOString(),
    status: mapStatus(competition.status, remainingTickets),
    watch: {
      id: competition.Watches?.id ?? '',
      brand: competition.Watches?.brand ?? 'Unknown',
      model: competition.Watches?.model ?? 'Unknown',
      referenceNumber: competition.Watches?.reference_number ?? '',
      movement: competition.Watches?.movement ?? '',
      braceletMaterial: competition.Watches?.Bracelet_material ?? '',
      yearOfManufacture: competition.Watches?.year_of_manifacture ?? 0,
      condition: competition.Watches?.condition ?? '',
      hasBox: competition.Watches?.has_box ?? false,
      hasCertificate: competition.Watches?.has_certificate ?? false,
      images:
        competition.Watches?.images_url.map((image) => ({
          url: image.url,
          alt: `${competition.name} image`,
        })) ?? [],
    },
  };
}
