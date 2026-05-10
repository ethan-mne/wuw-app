import { withSentryConfig } from '@sentry/nextjs';

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import('./src/env.js');
const isDev = process.env.NODE_ENV === 'development';

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ');

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    optimizePackageImports: [
      '@aws-sdk/client-s3',
      'date-fns',
      '@react-email/components',
    ],
  },
  images: {
    remotePatterns: [
      {
        hostname: 'loremflickr.com',
        protocol: 'https',
      },
      {
        hostname: 'firebasestorage.googleapis.com',
        protocol: 'https',
      },
      {
        hostname: 'winuwatch.s3.eu-west-3.amazonaws.com',
        protocol: 'https',
      },
      {
        hostname: 'd9ylgh2z4lcdz.cloudfront.net',
        protocol: 'https',
      },
    ],
  },
  async headers() {
    const securityHeaders = isDev
      ? []
      : [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ];

    const globalHeaders = securityHeaders.length
      ? [
          {
            source: '/:path*',
            headers: securityHeaders,
          },
        ]
      : [];

    return [
      ...globalHeaders,
      {
        source: '/new-images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/video/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

const isProd = process.env.VERCEL_ENV === 'production';

const sentryConfig = {
  org: 'iliass',
  project: 'winuwatch',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  disableSourceMapUpload: !isProd,
};

export default withSentryConfig(config, sentryConfig);
