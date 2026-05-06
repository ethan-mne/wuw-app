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

export type MobileOrderHistoryItem = {
  id: string;
  competitionId: string;
  ticketQuantity: number;
  ticketPrice: number;
  couponCode?: string;
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
