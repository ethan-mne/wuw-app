import { notFound } from 'next/navigation';

const locales = ['en', 'es', 'fr'] as const;
type Locale = (typeof locales)[number];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleRootPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!locales.includes(params.locale as Locale)) {
    notFound();
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>WINUWATCH API</h1>
      <p>This deployment exposes HTTP APIs and webhooks only.</p>
    </main>
  );
}
