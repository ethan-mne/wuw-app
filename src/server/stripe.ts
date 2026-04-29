// stripe setup
import Stripe from 'stripe';
import { env } from '@/env';

// stripe setup
const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

// create a checkout session
export const createCheckoutSession = async (input: {
  amount: number;
  currency: string;
}) => {
  const { amount, currency } = input;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: 'Test product',
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: 'http://localhost:3000/stripe?payment=success',
    cancel_url: 'http://localhost:3000/stripe?payment=failed',
  });

  return session.id;
};
