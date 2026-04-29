import { describe, expect, it } from 'vitest';
import { order_paymentMethod } from '@/lib/prisma-enums';
import {
  DEFAULT_STRIPE_ACCOUNT_PERCENTAGES,
  getPaymentMethodForStripeAccount,
  parseStripeAccountPercentages,
  selectStripeAccountByPercentage,
  selectStripeAccountFromEnv,
} from './stripe-routing';

describe('stripe routing percentages', () => {
  it('parses valid percentages from env format', () => {
    expect(parseStripeAccountPercentages('30,65,5')).toEqual({
      PRIMARY: 30,
      SECONDARY: 65,
      TWELVE: 5,
    });
  });

  it('parses valid percentages with whitespace', () => {
    expect(parseStripeAccountPercentages('30, 65, 5')).toEqual({
      PRIMARY: 30,
      SECONDARY: 65,
      TWELVE: 5,
    });
  });

  it('uses defaults when percentages are missing', () => {
    expect(parseStripeAccountPercentages(undefined)).toEqual(
      DEFAULT_STRIPE_ACCOUNT_PERCENTAGES,
    );
  });

  it.each(['30,65', '30,65,5,0', 'a,65,5', '30,-1,71', '30,70,5'])(
    'falls back to defaults when env is invalid: %s',
    (raw) => {
      expect(parseStripeAccountPercentages(raw)).toEqual(
        DEFAULT_STRIPE_ACCOUNT_PERCENTAGES,
      );
    },
  );
});

describe('stripe weighted account selection', () => {
  const weights = { PRIMARY: 30, SECONDARY: 65, TWELVE: 5 } as const;

  it('selects PRIMARY at lower range', () => {
    expect(selectStripeAccountByPercentage(weights, 0)).toBe('PRIMARY');
    expect(selectStripeAccountByPercentage(weights, 0.299999)).toBe('PRIMARY');
  });

  it('selects SECONDARY at middle range', () => {
    expect(selectStripeAccountByPercentage(weights, 0.3)).toBe('SECONDARY');
    expect(selectStripeAccountByPercentage(weights, 0.949999)).toBe(
      'SECONDARY',
    );
  });

  it('selects TWELVE at upper range', () => {
    expect(selectStripeAccountByPercentage(weights, 0.95)).toBe('TWELVE');
    expect(selectStripeAccountByPercentage(weights, 0.99999)).toBe('TWELVE');
  });

  it('clamps random values outside [0, 1)', () => {
    expect(selectStripeAccountByPercentage(weights, -1)).toBe('PRIMARY');
    expect(selectStripeAccountByPercentage(weights, 2)).toBe('TWELVE');
  });

  it('selects using env parser and fallback in one step', () => {
    expect(selectStripeAccountFromEnv('invalid', 0.96)).toBe('TWELVE');
  });
});

describe('stripe account payment method mapping', () => {
  it('maps PRIMARY to STRIPE', () => {
    expect(getPaymentMethodForStripeAccount('PRIMARY')).toBe(
      order_paymentMethod.STRIPE,
    );
  });

  it('maps SECONDARY to VOUCH_LAB', () => {
    expect(getPaymentMethodForStripeAccount('SECONDARY')).toBe(
      order_paymentMethod.VOUCH_LAB,
    );
  });

  it('maps TWELVE to TWELVE', () => {
    expect(getPaymentMethodForStripeAccount('TWELVE')).toBe(
      order_paymentMethod.TWELVE,
    );
  });
});
