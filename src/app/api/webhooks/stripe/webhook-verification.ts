import type { Stripe as StripeType } from 'stripe';
import type { StripeAccountType } from '@/lib/stripe';

const VERIFICATION_ORDER: readonly StripeAccountType[] = [
  'PRIMARY',
  'SECONDARY',
  'TWELVE',
];

type StripeWebhookErrors = Partial<Record<StripeAccountType, unknown>>;

export class StripeWebhookVerificationError extends Error {
  readonly accountErrors: StripeWebhookErrors;

  constructor(accountErrors: StripeWebhookErrors) {
    super('Invalid webhook signature');
    this.name = 'StripeWebhookVerificationError';
    this.accountErrors = accountErrors;
  }
}

export function verifyStripeWebhookEvent(
  verifyByAccount: (stripeAccount: StripeAccountType) => StripeType.Event,
): {
  event: StripeType.Event;
  stripeAccount: StripeAccountType;
} {
  const errors: StripeWebhookErrors = {};

  for (const stripeAccount of VERIFICATION_ORDER) {
    try {
      const event = verifyByAccount(stripeAccount);
      return { event, stripeAccount };
    } catch (error) {
      errors[stripeAccount] = error;
    }
  }

  throw new StripeWebhookVerificationError(errors);
}
