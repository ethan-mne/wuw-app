// import { type  DomainConfig } from 'next-intl/dist/types/src/MiddlewareConfig'

import type { Pathnames } from 'next-intl/navigation';

export const locales = ['en', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const pathnames = {
  '/': '/',
  '/api/auth/signin': '/api/auth/signin',
  '/api/auth/signout': '/api/auth/signout',
  '/account/profile': '/account/profile',
  '/about-us': '/about-us',
  '/faq': '/faq',
  '/feed': '/feed',
  '/winners': '/winners',
  '/howtoplay': '/howtoplay',
  '/acceptable-use-policy': '/acceptable-use-policy',
  '/privacy-policy': '/privacy-policy',
  '/terms-and-conditions': '/terms-and-conditions',
  '/return-policy': '/return-policy',
  '/disclaimer': '/disclaimer',
  '/engagement': '/engagement',
  '/competitions': '/competitions',
  '/competitions/:id': '/competitions/:id',
  '/competitions/:id/confirmation': '/competitions/:id/confirmation',
  '/account/dashboard': '/account/dashboard',
  'https://www.associationsuperheros.org/':
    'https://www.associationsuperheros.org/',
  'https://www.michaeljfox.org/': 'https://www.michaeljfox.org/',
  'mailto:info@winuwatch.com?subject=Contact from Website':
    'mailto:info@winuwatch.com?subject=Contact from Website',
  '/contact-us': '/contact-us',
  '/refund-and-cancellation': '/refund-and-cancellation',
} satisfies Pathnames<typeof locales>;

export const localePrefix = 'always';
// export const domains: Array<DomainConfig<typeof locales>> = [
//   {
//     domain: 'winuwatch.co.il',
//     locales: ['il'],
//     defaultLocale: 'il',
//   },
//   {
//     domain: 'winuwatch.com',
//     locales: ['en', 'es', 'fr', 'ja'],
//     defaultLocale: 'en',
//   },
//   {
//     domain: 'localhost:3000',
//     locales: ['en', 'es', 'fr', 'ja', 'il'],
//     defaultLocale: 'en',
//   },
// ]
export type AppPathnames = keyof typeof pathnames;
