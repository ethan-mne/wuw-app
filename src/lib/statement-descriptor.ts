import type { order_paymentMethod } from '@prisma/client';

const DESCRIPTORS: Partial<Record<order_paymentMethod, string>> = {
  STRIPE: 'KRONOGRAPHER / INFRA LIBRE LIMITED',
  VOUCH_LAB: 'VOUCH / MARKETWINTIME LIMITED',
  TWELVE: 'Twenty Four Twelve Society International Limited',
};

export function getStatementDescriptor(
  paymentMethod?: order_paymentMethod,
): string {
  if (!paymentMethod) {
    return 'LISAM WATCH LTD';
  }
  return DESCRIPTORS[paymentMethod] ?? 'LISAM WATCH LTD';
}
