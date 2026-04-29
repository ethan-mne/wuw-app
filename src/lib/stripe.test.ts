import { describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_primary',
    STRIPE_SECRET_KEY_SECONDARY: 'sk_test_secondary',
    STRIPE_SECRET_KEY_TWELVE: 'sk_test_twelve',
  },
}));

interface MockStripeInstance {
  _apiKey: string;
}

const MockStripe = vi.fn().mockImplementation((key: string): MockStripeInstance => ({
  _apiKey: key,
}));

vi.mock('stripe', () => ({
  default: MockStripe,
}));

const stripeInstances = [
  {
    label: 'Stripe (primary)',
    exportName: 'Stripe',
    expectedKey: 'sk_test_primary',
  },
  {
    label: 'StripeSecondary',
    exportName: 'StripeSecondary',
    expectedKey: 'sk_test_secondary',
  },
  {
    label: 'StripeTwelve',
    exportName: 'StripeTwelve',
    expectedKey: 'sk_test_twelve',
  },
] as const;

describe('stripe module', () => {
  it.each(stripeInstances)(
    '$label is initialized correctly',
    async ({ exportName, expectedKey }) => {
      const stripeModule = await import('./stripe');
      const instance = (stripeModule as Record<string, unknown>)[exportName];
      expect(MockStripe).toHaveBeenCalledWith(
        expectedKey,
        expect.objectContaining({
          apiVersion: '2022-11-15',
        }),
      );
      expect((instance as MockStripeInstance)._apiKey).toBe(expectedKey);
    },
  );

  it('StripePrimary is same reference as Stripe', async () => {
    const { Stripe, StripePrimary } = await import('./stripe');
    expect(StripePrimary).toBe(Stripe);
  });
});
