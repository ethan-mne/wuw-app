import PostHog from 'posthog-js';
import type { PostHogConfig } from 'posthog-js';
import { env } from '@/env';
// Initialize PostHog
export const posthog =
  typeof window !== 'undefined'
    ? PostHog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug();
        },
        autocapture: true,
        capture_pageview: true,
        persistence: 'localStorage',
        bootstrap: {
          featureFlags: {
            new_checkout: false, // default to old flow
          },
        },
      } as Partial<PostHogConfig>)
    : null;

// Export PostHog instance
export default posthog;
