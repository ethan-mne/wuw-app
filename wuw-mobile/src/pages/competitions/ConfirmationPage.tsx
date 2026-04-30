import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';

export function ConfirmationPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Confirmation"
        title="Order confirmed"
        description="Placeholder for the web confirmation route."
      />
      <Card>
        <p>Order reference: {params.orderId}</p>
        <ActionLink to={withLocale(locale, 'account/history')}>View history</ActionLink>
      </Card>
    </section>
  );
}
