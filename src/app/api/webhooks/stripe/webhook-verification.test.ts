import { describe, expect, it } from 'vitest';
import {
  StripeWebhookVerificationError,
  verifyStripeWebhookEvent,
} from './webhook-verification';
import type { Stripe as StripeType } from 'stripe';

describe('verifyStripeWebhookEvent', () => {
  it('accepts primary signature first and stops fallback checks', () => {
    const attempts: string[] = [];
    const event = { type: 'checkout.session.completed' } as StripeType.Event;

    const result = verifyStripeWebhookEvent((account) => {
      attempts.push(account);
      if (account === 'PRIMARY') {
        return event;
      }
      throw new Error('should not reach fallback');
    });

    expect(result).toEqual({ event, stripeAccount: 'PRIMARY' });
    expect(attempts).toEqual(['PRIMARY']);
  });

  it('falls back to secondary when primary verification fails', () => {
    const attempts: string[] = [];
    const event = { type: 'checkout.session.completed' } as StripeType.Event;

    const result = verifyStripeWebhookEvent((account) => {
      attempts.push(account);
      if (account === 'SECONDARY') {
        return event;
      }
      throw new Error(`${account} failed`);
    });

    expect(result).toEqual({ event, stripeAccount: 'SECONDARY' });
    expect(attempts).toEqual(['PRIMARY', 'SECONDARY']);
  });

  it('falls back to twelve when primary and secondary fail', () => {
    const attempts: string[] = [];
    const event = { type: 'checkout.session.completed' } as StripeType.Event;

    const result = verifyStripeWebhookEvent((account) => {
      attempts.push(account);
      if (account === 'TWELVE') {
        return event;
      }
      throw new Error(`${account} failed`);
    });

    expect(result).toEqual({ event, stripeAccount: 'TWELVE' });
    expect(attempts).toEqual(['PRIMARY', 'SECONDARY', 'TWELVE']);
  });

  it('throws verification error when all account checks fail', () => {
    expect.assertions(5);

    try {
      verifyStripeWebhookEvent((account) => {
        throw new Error(`${account} failed`);
      });
    } catch (error) {
      expect(error).toBeInstanceOf(StripeWebhookVerificationError);
      if (!(error instanceof StripeWebhookVerificationError)) {
        return;
      }

      expect(error.accountErrors.PRIMARY).toBeInstanceOf(Error);
      expect(error.accountErrors.SECONDARY).toBeInstanceOf(Error);
      expect(error.accountErrors.TWELVE).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid webhook signature');
    }
  });
});
