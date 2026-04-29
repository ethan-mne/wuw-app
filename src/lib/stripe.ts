import stripe from 'stripe';
import { env } from '@/env';

// Primary Stripe instance
export const Stripe = new stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

// Secondary Stripe instance (Vouch Lab)
export const StripeSecondary = new stripe(env.STRIPE_SECRET_KEY_SECONDARY, {
  apiVersion: '2022-11-15',
});

// Third Stripe instance (Twelve)
export const StripeTwelve = new stripe(env.STRIPE_SECRET_KEY_TWELVE, {
  apiVersion: '2022-11-15',
});

// Named exports for clarity
export const StripePrimary = Stripe;

// Type for Stripe account selection
export type StripeAccountType = 'PRIMARY' | 'SECONDARY' | 'TWELVE';
