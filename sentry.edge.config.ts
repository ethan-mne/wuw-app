// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const isSentryEnabled = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: 'https://05087b65318343fd7e286d0bc8337670@o4504842386341888.ingest.sentry.io/4506190809923584',
  enabled: isSentryEnabled,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: isSentryEnabled ? 0.1 : 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
})
