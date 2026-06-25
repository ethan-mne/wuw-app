import type { CompetitionStatus as CompetitionStatusType } from '@prisma/client';
import { CompetitionStatus } from '@/lib/prisma-enums';

type CompetitionWithWatch = {
  id: string;
  name: string;
  start_date: Date;
  total_tickets: number;
  ticket_price: number;
  price: number;
  cash_alternative?: number | null;
  max_winners?: number;
  end_date: Date;
  drawing_date: Date;
  status: CompetitionStatusType;
  comp_image_url: string | null;
  Watches: {
    id: string;
    brand: string;
    model: string;
    reference_number: string;
    movement: string;
    Bracelet_material: string;
    glass: string;
    bezel_material: string;
    year_of_manifacture: number;
    condition: string;
    has_box: boolean;
    has_certificate: boolean;
    images_url: Array<{ url: string }>;
  } | null;
  _count: {
    Ticket: number;
  };
};

/** Row shape for home list + draws timeline (one thumbnail, brand/model only). */
type CompetitionListRow = {
  id: string;
  name: string;
  start_date: Date;
  total_tickets: number;
  ticket_price: number;
  price: number;
  cash_alternative?: number | null;
  max_winners?: number;
  end_date: Date;
  drawing_date: Date;
  status: CompetitionStatusType;
  comp_image_url: string | null;
  Watches: {
    brand: string;
    model: string;
    images_url: Array<{ url: string }>;
  } | null;
  _count: {
    Ticket: number;
  };
};

export type MobileCompetitionDto = {
  id: string;
  name: string;
  startDate: string;
  totalTickets: number;
  remainingTickets: number;
  ticketPrice: number;
  price: number;
  cashAlternative: number | null;
  maxWinners: number;
  endDate: string;
  /** Canonical live draw instant (ISO 8601). */
  drawingDate: string;
  /** Explicit draw schedule version so mobile can audit and reconcile updates. */
  drawScheduleVersion: string;
  status: 'ACTIVE' | 'OPEN' | 'CLOSED';
  competitionImageUrl: string | null;
  watch: {
    id: string;
    brand: string;
    model: string;
    referenceNumber: string;
    movement: string;
    braceletMaterial: string;
    glass: string;
    bezelMaterial: string;
    yearOfManufacture: number;
    condition: string;
    hasBox: boolean;
    hasCertificate: boolean;
    images: Array<{ url: string; alt: string }>;
  };
};

function computeDrawScheduleVersion(competition: CompetitionWithWatch): string {
  return `v1:${competition.drawing_date.toISOString()}|${competition.end_date.toISOString()}`;
}

function mapStatus(
  status: CompetitionStatusType,
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

function remainingTicketsFor(competition: {
  total_tickets: number;
  _count: { Ticket: number };
}): number {
  return Math.max(competition.total_tickets - competition._count.Ticket, 0);
}

function resolveListThumbnailImages(
  competition: Pick<CompetitionListRow, 'name' | 'comp_image_url' | 'Watches'>,
): MobileCompetitionDto['watch']['images'] {
  const hero = competition.comp_image_url?.trim();
  if (hero) {
    return [{ url: hero, alt: `${competition.name} image` }];
  }

  const firstWatchUrl = competition.Watches?.images_url[0]?.url?.trim();
  if (firstWatchUrl) {
    return [{ url: firstWatchUrl, alt: `${competition.name} image` }];
  }

  return [];
}

/** Lighter payload for list/timeline cards: one image + brand/model only. */
export function mapCompetitionToMobileListDto(
  competition: CompetitionListRow,
): MobileCompetitionDto {
  const remainingTickets = remainingTicketsFor(competition);

  return {
    id: competition.id,
    name: competition.name,
    startDate: competition.start_date.toISOString(),
    totalTickets: competition.total_tickets,
    remainingTickets,
    ticketPrice: competition.ticket_price,
    price: competition.price,
    cashAlternative: competition.cash_alternative ?? null,
    maxWinners: competition.max_winners ?? 1,
    endDate: competition.end_date.toISOString(),
    drawingDate: competition.drawing_date.toISOString(),
    drawScheduleVersion: computeDrawScheduleVersion(competition),
    status: mapStatus(competition.status, remainingTickets),
    competitionImageUrl: competition.comp_image_url,
    watch: {
      id: '',
      brand: competition.Watches?.brand ?? 'Unknown',
      model: competition.Watches?.model ?? 'Unknown',
      referenceNumber: '',
      movement: '',
      braceletMaterial: '',
      glass: '',
      bezelMaterial: '',
      yearOfManufacture: 0,
      condition: '',
      hasBox: false,
      hasCertificate: false,
      images: resolveListThumbnailImages(competition),
    },
  };
}

export function mapCompetitionToMobileDto(
  competition: CompetitionWithWatch,
): MobileCompetitionDto {
  const remainingTickets = remainingTicketsFor(competition);

  return {
    id: competition.id,
    name: competition.name,
    startDate: competition.start_date.toISOString(),
    totalTickets: competition.total_tickets,
    remainingTickets,
    ticketPrice: competition.ticket_price,
    price: competition.price,
    cashAlternative: competition.cash_alternative ?? null,
    maxWinners: competition.max_winners ?? 1,
    endDate: competition.end_date.toISOString(),
    drawingDate: competition.drawing_date.toISOString(),
    drawScheduleVersion: computeDrawScheduleVersion(competition),
    status: mapStatus(competition.status, remainingTickets),
    competitionImageUrl: competition.comp_image_url,
    watch: {
      id: competition.Watches?.id ?? '',
      brand: competition.Watches?.brand ?? 'Unknown',
      model: competition.Watches?.model ?? 'Unknown',
      referenceNumber: competition.Watches?.reference_number ?? '',
      movement: competition.Watches?.movement ?? '',
      braceletMaterial: competition.Watches?.Bracelet_material ?? '',
      glass: competition.Watches?.glass ?? '',
      bezelMaterial: competition.Watches?.bezel_material ?? '',
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
