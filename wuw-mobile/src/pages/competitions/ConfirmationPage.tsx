import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { INFORMATIVE_ONLY_MODE } from '../../config/informativeOnlyMode';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';

export function ConfirmationPage() {
  const params = useParams();
  const navigate = useNavigate();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  useEffect(() => {
    if (!INFORMATIVE_ONLY_MODE) return;
    const id = params.id;
    const target =
      id !== undefined && id !== ''
        ? withLocale(locale, `competitions/${id}`)
        : withLocale(locale, '');
    navigate(target, { replace: true });
  }, [locale, navigate, params.id]);

  if (INFORMATIVE_ONLY_MODE) {
    return (
      <div className="home-competitions-loading" role="status" aria-live="polite">
        <span className="home-competitions-loading-spinner" aria-hidden />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

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
