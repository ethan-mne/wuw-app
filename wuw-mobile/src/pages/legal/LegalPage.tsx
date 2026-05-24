import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { legalPages } from '../../data/content';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';

interface LegalPageProps {
  pageKey: (typeof legalPages)[number]['path'];
}

export function LegalPage({ pageKey }: LegalPageProps) {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const page = legalPages.find((item) => item.path === pageKey);

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Legal"
        title={page?.title ?? 'Legal page'}
        description="Skeleton legal screen with the same route naming as the source web app."
      />
      <Card>
        <p>
          Legal content is intentionally placeholder-only in the mobile V1. The route is
          present so navigation can stay aligned with the web product.
        </p>
        <ActionLink to={withLocale(locale, '')}>Back to home</ActionLink>
      </Card>
    </section>
  );
}
