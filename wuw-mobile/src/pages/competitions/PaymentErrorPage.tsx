import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';

export function PaymentErrorPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Payment error"
        title="Payment could not be completed"
        description="Mobile placeholder for the web checkout error route."
      />
      <Card>
        <ActionLink to={withLocale(locale, `competitions/${params.id ?? ''}`)}>
          Return to competition
        </ActionLink>
      </Card>
    </section>
  );
}
