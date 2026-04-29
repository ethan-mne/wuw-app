import createIntlMiddleware from 'next-intl/middleware';
import { withAuth } from 'next-auth/middleware';
import { pathnames, locales, localePrefix } from './config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BLOCKED_COUNTRIES: Array<string> = [];
//const protectedPathRegex = /^\/account(\/|$)/;
//const publicPages = ['/'];

const intlMiddleware = createIntlMiddleware({
  locales,
  pathnames,
  localePrefix,
  defaultLocale: 'en',
});

const authMiddleware = withAuth(
  // Note that this callback is only invoked if
  // the `authorized` callback has returned `true`
  // and not for pages listed in `pages`.
  function onSuccess(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token }) => token != null,
    },
    pages: {
      signIn: '/api/auth/signin',
    },
  },
);

export default async function middleware(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country');
  // if (country == 'GB') {
  //   return NextResponse.redirect(new URL('/unavailable', request.url));
  // }
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname.startsWith('/monitoring')) {
    return NextResponse.next();
  }
  const isAccountPage = request.nextUrl.pathname.includes('/account');
  // console.log("ruining  middleware", request.nextUrl.pathname, request.url);
  const isBlocked = BLOCKED_COUNTRIES.includes(
    request.headers.get('x-vercel-ip-country') ?? '',
  );
  if (isBlocked) {
    return NextResponse.rewrite(new URL('/unavailable', request.url));
  }
  //if the path is /dashboard, redirect to /dashboard
  if (request.nextUrl.pathname === '/dashboard') {
    return NextResponse.next();
  }
  // if (isBlocked || request.nextUrl.pathname !== "/unavailable") {
  //   return NextResponse.redirect(new URL("/unavailable", request.url));
  // }
  if (!isAccountPage) {
    return intlMiddleware(request);
  } else {
    // @ts-expect-error - `authorized` is not part of the type
    return authMiddleware(request);
  }
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(en|es|fr|ja|il)/:path*',
    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)',
    '/((?!api|_next|.*\\..*).*)',
  ],
};
