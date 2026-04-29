// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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
  integrations: [Sentry.prismaIntegration()],
})
