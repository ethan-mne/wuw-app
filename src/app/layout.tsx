import { type Metadata } from 'next';
import { type ReactNode } from 'react';
import { type Locale } from '@/config';
import { cn } from '@/lib/utils';
import { helvetica } from '@/lib/fonts';
import { TRPCReactProvider } from '@/trpc/react';
import { Toaster } from '@/components/ui/sonner';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import Script from 'next/script';
import { UtmCookie } from './UtmCookie';
import { CSPostHogProvider, Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://winuwatch.com'),
  title: {
    default: 'WINUWATCH - Luxury Watch Contest',
    template: '%s | WINUWATCH',
  },
  description:
    'Join WINUWATCH luxury watch competitions and get a chance to win premium timepieces with secure checkout and transparent draws.',
  openGraph: {
    type: 'website',
    url: 'https://winuwatch.com/en',
    siteName: 'WINUWATCH',
    title: 'WINUWATCH - Luxury Watch Contest',
    description:
      'Join WINUWATCH luxury watch competitions and get a chance to win premium timepieces with secure checkout and transparent draws.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WINUWATCH - Luxury Watch Contest',
    description:
      'Join WINUWATCH luxury watch competitions and get a chance to win premium timepieces.',
  },
};
// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params?: { locale?: Locale };
}>) {
  const pageLocale = params?.locale ?? 'en';

  return (
    <html lang={pageLocale} suppressHydrationWarning>
      <head>
        {/* ! removed google translation widget
      this can be removed its only added
       because google translation affects hydration process */}
        <meta name='google' content='notranslate' />
        <GoogleTagManager gtmId='GTM-TZW8GKQF' />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-helve antialiased ',
          helvetica.className,
        )}
      >
        <Providers>
          <CSPostHogProvider>
            <TRPCReactProvider>{children}</TRPCReactProvider>
            <Toaster />
            <UtmCookie />
          </CSPostHogProvider>
        </Providers>
        {/* <Script
          async
          src='https://www.googletagmanager.com/gtag/js?id=G-LY2QC1SJ1P'
        />
        <Script id='google-analytics'>
          {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LY2QC1SJ1P');
          `}
        </Script>
        <Script
          id='google-tag-manager'
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id=%27+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TZW8GKQF');`,
          }}
        /> */}
        <Script
          src='https://vmi1454387.contaboserver.net:8300/integration/general_integration'
          type='text/javascript'
          strategy='afterInteractive'
        />
        <GoogleAnalytics gaId='G-LY2QC1SJ1P' />
      </body>
    </html>
  );
}
