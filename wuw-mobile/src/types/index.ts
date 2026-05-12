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
  /** Canonical live draw instant (ISO); from `drawing_date` on the API. */
  drawingDate: string;
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
  /** From API when available */
  competitionName?: string;
  competitionImageUrl?: string | null;
  ticketQuantity: number;
  ticketPrice: number;
  couponCode?: string;
  /** ISO 8601 order date from API */
  orderedAt?: string;
}

export interface AccountSummary {
  userName: string;
  email: string;
  points: number;
  activeTickets: number;
  referralCode: string;
}

/** `GET /api/mobile/v1/referrals/usage` — coupon uses by others. */
export interface ReferralUsageItem {
  customerName: string;
  usedAt: string;
  competitionName: string;
  wincoinsEarned: number;
}

/** Matches `GET/PUT /api/mobile/v1/me` profile fields. */
export interface MobileUserProfile {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  zipCode: string | null;
  address: string | null;
  city: string | null;
  image: string | null;
  /** ISO date string when set */
  emailVerified: string | null;
}

/** Router state from login after send-otp succeeds. */
export type VerificationRouteState = {
  email: string;
  otpId: string;
};
