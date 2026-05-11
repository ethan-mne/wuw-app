import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

function skipEnvValidationEnabled(raw) {
  if (raw == null || raw === '') return false;
  return ['1', 'true', 'yes'].includes(String(raw).toLowerCase());
}

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env variables.
   */
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_SECRET_KEY_SECONDARY: z.string().min(1),
    STRIPE_SECRET_KEY_TWELVE: z.string().min(1),
    STRIPE_ENDPOINT_SECRET: z.string().min(1),
    STRIPE_ENDPOINT_SECRET_SECONDARY: z.string().min(1),
    STRIPE_ENDPOINT_SECRET_TWELVE: z.string().min(1),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.string().min(1),
    SMTP_USER: z.string().min(1),
    SMTP_PASSWORD: z.string().min(1),
    ADMIN_PASSWORD: z.string().default('1234'),
    HOST: z.string(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    PAYPAL_APP_SECRET: z.string().min(1),
    PAYPAL_API_BASE: z.string().url(),
    PAYPAL_WEBHOOK_ID: z.string().min(1),
    AUREAVIA_ENDPOINT: z
      .string()
      .url()
      .default('https://uiservices.aureavia.com/hosted/default.aspx'),
    AUREAVIA_MERCHANT_ID: z.string().min(1).default('6616716'),
    AUREAVIA_HASH_KEY: z.string().min(1).default('9HJIEL22IX'),
    BASE_URL: z.string().url(),
    WORLD_CARD_URL: z.string().url(),
    WORLD_CARD_ENTITY_ID: z.string().min(1),
    WORLD_CARD_AUTH_BEARER: z.string().min(1),
    WORLD_CARD_DEC_KEY: z.string().min(1),
    PAYMENT_METHODS: z
      .enum(['STRIPE', 'PAYPAL', 'AUREAVIA', 'WORLDCARD'])
      .default('STRIPE'),
    PAYMENT_GATEWAY_URL: z.string().min(1),
    PAYMENT_GATEWAY_URL_SECONDARY: z.string().min(1),
    PAYMENT_GATEWAY_URL_TWELVE: z.string().min(1),
    STRIPE_ACCOUNT_PERCENTAGES: z.string().default('30,65,5'),
    DASHBOARD_DEV_BYPASS: z.enum(['true', 'false']).default('false'),
  },
  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_GA_TRACKING_ID: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1),
    NEXT_PUBLIC_PAYMENT_API: z.string().url(),
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    NEXT_PUBLIC_WORLD_CARD_URL: z.string().url(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    PAYMENT_GATEWAY_URL: process.env.PAYMENT_GATEWAY_URL,
    PAYMENT_GATEWAY_URL_SECONDARY: process.env.PAYMENT_GATEWAY_URL_SECONDARY,
    PAYMENT_GATEWAY_URL_TWELVE: process.env.PAYMENT_GATEWAY_URL_TWELVE,
    PAYMENT_METHODS: process.env.PAYMENT_METHODS,
    STRIPE_ACCOUNT_PERCENTAGES: process.env.STRIPE_ACCOUNT_PERCENTAGES,
    DASHBOARD_DEV_BYPASS: process.env.DASHBOARD_DEV_BYPASS,
    WORLD_CARD_URL: process.env.NEXT_PUBLIC_WORLD_CARD_URL,
    NEXT_PUBLIC_WORLD_CARD_URL: process.env.NEXT_PUBLIC_WORLD_CARD_URL,
    WORLD_CARD_ENTITY_ID: process.env.WORLD_CARD_ENTITY_ID,
    WORLD_CARD_AUTH_BEARER: process.env.WORLD_CARD_AUTH_BEARER,
    WORLD_CARD_DEC_KEY: process.env.WORLD_CARD_DEC_KEY,
    BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    PAYPAL_API_BASE: process.env.PAYPAL_API_BASE,
    PAYPAL_APP_SECRET: process.env.PAYPAL_APP_SECRET,
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    STRIPE_ENDPOINT_SECRET: process.env.STRIPE_ENDPOINT_SECRET,
    STRIPE_ENDPOINT_SECRET_SECONDARY:
      process.env.STRIPE_ENDPOINT_SECRET_SECONDARY,
    STRIPE_ENDPOINT_SECRET_TWELVE: process.env.STRIPE_ENDPOINT_SECRET_TWELVE,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_SECRET_KEY_SECONDARY: process.env.STRIPE_SECRET_KEY_SECONDARY,
    STRIPE_SECRET_KEY_TWELVE: process.env.STRIPE_SECRET_KEY_TWELVE,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    HOST: process.env.NEXTAUTH_URL ?? process.env.HOST,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_PAYMENT_API: process.env.NEXT_PUBLIC_PAYMENT_API,
    AUREAVIA_ENDPOINT: process.env.AUREAVIA_ENDPOINT,
    AUREAVIA_MERCHANT_ID: process.env.AUREAVIA_MERCHANT_ID,
    AUREAVIA_HASH_KEY: process.env.AUREAVIA_HASH_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   *
   * Set to `1`, `true`, or `yes` to skip (use `0` / unset for strict validation in full-web deploys).
   */
  skipValidation: skipEnvValidationEnabled(process.env.SKIP_ENV_VALIDATION),
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
