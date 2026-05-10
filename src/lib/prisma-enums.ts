import type {
  CompetitionStatus as PrismaCompetitionStatus,
  order_paymentMethod as PrismaOrderPaymentMethod,
  order_status as PrismaOrderStatus,
} from '@prisma/client';

export const CompetitionStatus = {
  ACTIVE: 'ACTIVE',
  NOT_ACTIVE: 'NOT_ACTIVE',
  COMPLETED: 'COMPLETED',
} as const satisfies Record<PrismaCompetitionStatus, PrismaCompetitionStatus>;

export const order_paymentMethod = {
  PAYPAL: 'PAYPAL',
  STRIPE: 'STRIPE',
  AFFILIATION: 'AFFILIATION',
  MARKETING: 'MARKETING',
  WINCOIN: 'WINCOIN',
  AUREAVIA: 'AUREAVIA',
  WORLDCARD: 'WORLDCARD',
  VOUCH_LAB: 'VOUCH_LAB',
} as const satisfies Record<PrismaOrderPaymentMethod, PrismaOrderPaymentMethod>;

export const order_status = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  INCOMPLETE: 'INCOMPLETE',
  ATTEMPTED: 'ATTEMPTED',
} as const satisfies Record<PrismaOrderStatus, PrismaOrderStatus>;
