import '@/styles/globals.css';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { locales, type Locale } from '@/config';
import { cn } from '@/lib/utils';
import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { NextIntlProvider } from './next-intl-provider';
import { getPublicHomeStats } from '@/server/public-home-data';

export const generateStaticParams = async () =>
  locales.map((locale) => ({ locale }));

export default async function AppLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  if (!locales.includes(locale)) return notFound();
  unstable_setRequestLocale(locale);
  const { instagramCount } = await getPublicHomeStats();

  return (
    <NextIntlProvider>
      <Header />
      <div className={cn('relative flex min-h-screen flex-col bg-background')}>
        <main className='flex-1'>{children}</main>
      </div>
      <Footer instagramCount={instagramCount} />
    </NextIntlProvider>
  );
}
