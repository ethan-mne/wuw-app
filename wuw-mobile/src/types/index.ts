export type Locale = 'en' | 'es' | 'fr';

export type CompetitionStatus = 'ACTIVE' | 'OPEN' | 'CLOSED';

export interface WatchImage {
  url: string;
  alt: string;
}

export interface Watch {
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
  images: WatchImage[];
}

export interface Competition {
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
  status: CompetitionStatus;
  /** Competition hero/promo image; excluded from challenge when also in watch gallery. */
  competitionImageUrl?: string | null;
  watch: Watch;
}

export interface Winner {
  id: string;
  name: string;
  prize: string;
  location: string;
  imageUrl: string;
  drawDate: string;
}

export interface OrderSummary {
  id: string;
  competitionId: string;
  ticketQuantity: number;
  ticketPrice: number;
  couponCode?: string;
}

export interface AccountSummary {
  userName: string;
  email: string;
  points: number;
  activeTickets: number;
  referralCode: string;
}
