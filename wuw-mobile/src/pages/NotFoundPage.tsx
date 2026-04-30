import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../components/ui';
import { defaultLocale, isLocale, withLocale } from '../routes/locales';

export function NotFoundPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <section className="page-stack">
      <PageHeader eyebrow="404" title="Page not found" />
      <Card>
        <p>This mirrors the source catch-all behavior in a mobile-friendly way.</p>
        <ActionLink to={withLocale(locale)}>Back home</ActionLink>
      </Card>
    </section>
  );
}
