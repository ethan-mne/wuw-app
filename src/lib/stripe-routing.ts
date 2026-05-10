import type { order_paymentMethod as PrismaOrderPaymentMethod } from '@prisma/client';
import type { StripeAccountType } from '@/lib/stripe';
import { order_paymentMethod } from '@/lib/prisma-enums';

const STRIPE_ACCOUNT_ORDER: readonly StripeAccountType[] = [
  'PRIMARY',
  'SECONDARY',
  'TWELVE',
];

const EXPECTED_PERCENTAGES_COUNT = STRIPE_ACCOUNT_ORDER.length;
const TOTAL_PERCENTAGE = 100;

export const DEFAULT_STRIPE_ACCOUNT_PERCENTAGES = {
  PRIMARY: 30,
  SECONDARY: 65,
  TWELVE: 5,
} as const;

export type StripeAccountPercentages = Record<StripeAccountType, number>;

function createStripeAccountPercentages(
  primary: number,
  secondary: number,
  twelve: number,
): StripeAccountPercentages {
  return {
    PRIMARY: primary,
    SECONDARY: secondary,
    TWELVE: twelve,
  };
}

function getDefaultPercentages(): StripeAccountPercentages {
  return { ...DEFAULT_STRIPE_ACCOUNT_PERCENTAGES };
}

function isValidPercentages(values: number[]): boolean {
  if (values.length !== EXPECTED_PERCENTAGES_COUNT) {
    return false;
  }

  if (!values.every((value) => Number.isFinite(value) && value >= 0)) {
    return false;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.abs(total - TOTAL_PERCENTAGE) < Number.EPSILON;
}

export function parseStripeAccountPercentages(
  rawPercentages?: string | null,
): StripeAccountPercentages {
  const fallback = getDefaultPercentages();
  if (!rawPercentages) {
    return fallback;
  }

  const values = rawPercentages
    .split(',')
    .map((value) => Number.parseFloat(value.trim()));

  if (!isValidPercentages(values)) {
    return fallback;
  }

  const [primary, secondary, twelve] = values;
  if (
    typeof primary !== 'number' ||
    typeof secondary !== 'number' ||
    typeof twelve !== 'number'
  ) {
    return fallback;
  }

  return createStripeAccountPercentages(primary, secondary, twelve);
}

export function selectStripeAccountByPercentage(
  percentages: StripeAccountPercentages,
  random: number = Math.random(),
): StripeAccountType {
  const safeRandom = Math.max(0, Math.min(random, 0.999999999999));
  const scaled = safeRandom * TOTAL_PERCENTAGE;

  if (scaled < percentages.PRIMARY) {
    return 'PRIMARY';
  }

  if (scaled < percentages.PRIMARY + percentages.SECONDARY) {
    return 'SECONDARY';
  }

  return 'TWELVE';
}

export function selectStripeAccountFromEnv(
  rawPercentages?: string | null,
  random: number = Math.random(),
): StripeAccountType {
  const percentages = parseStripeAccountPercentages(rawPercentages);
  return selectStripeAccountByPercentage(percentages, random);
}

export function getPaymentMethodForStripeAccount(
  stripeAccount: StripeAccountType,
): PrismaOrderPaymentMethod {
  switch (stripeAccount) {
    case 'PRIMARY':
      return order_paymentMethod.STRIPE;
    case 'SECONDARY':
      return order_paymentMethod.VOUCH_LAB;
    case 'TWELVE':
      return order_paymentMethod.STRIPE;
  }
}
