import { env } from '@/env';

export function isPaymentMethodEnabled(method: 'STRIPE' | 'PAYPAL' | 'AUREAVIA' | 'WORLDCARD') {
  return env.PAYMENT_METHODS === method;
}
