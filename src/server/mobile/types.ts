import type { MobileCompetitionDto } from '@/server/lightweight/competition/mapper';

export type MobileApiDataResponse<T> = {
  data: T;
};

export type MobileWinnersResponse = {
  data: Array<{
    id: string;
    name: string;
    prize: string;
    location: string;
    imageUrl: string;
    drawDate: string;
  }>;
  hasMore: boolean;
};

export type MobileReferralUsageItem = {
  customerName: string;
  usedAt: string;
  competitionName: string;
  wincoinsEarned: number;
};

export type MobileOrderHistoryItem = {
  id: string;
  competitionId: string;
  /** Denormalized from Competition for mobile list UI */
  competitionName: string;
  competitionImageUrl: string | null;
  ticketQuantity: number;
  ticketPrice: number;
  couponCode?: string;
  /** ISO 8601 — order confirmation / creation time */
  orderedAt: string;
};

export type MobileAccountSummary = {
  userName: string;
  email: string | null;
  points: number | null;
  activeTickets: number;
  referralCode: string;
};

export type MobileProfileUpdateInput = {
  firstname: string;
  lastname: string;
  country: string;
  zip: string;
  address: string;
  city: string;
  phone: string;
  email: string;
};

export type MobileCompetition = MobileCompetitionDto;
