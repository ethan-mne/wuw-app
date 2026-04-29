'use client';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { env } from '@/env';

const PAYPAL_DEFAULT_CONFIG = {
  clientId: env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  currency: 'GBP',
  intent: 'capture',
  components: 'buttons,applepay',
  disableFunding: 'paylater,venmo,credit',
  enableFunding: 'card',
};

export const PaypalProvider = ({ children }: { children: React.ReactNode }) => (
  <PayPalScriptProvider options={PAYPAL_DEFAULT_CONFIG}>
    {children}
  </PayPalScriptProvider>
);
