import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader, StatPill } from '../../components/ui';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { Competition } from '../../types';

export function CheckoutPage() {
  const [quantity, setQuantity] = useState(1);
  const [competition, setCompetition] = useState<Competition>();
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  useEffect(() => {
    void mobileDataService
      .getCompetition(params.id)
      .then((data) => {
        setCompetition(data);
        setLoading(false);
      })
      .catch(() => {
        setCompetition(undefined);
        setLoading(false);
      });
  }, [params.id]);
  const total = (competition?.ticketPrice ?? 0) * quantity;

  if (loading) {
    return <p>Loading checkout...</p>;
  }

  if (!competition) {
    return (
      <Card>
        <h2>Checkout unavailable</h2>
        <ActionLink to={withLocale(locale, 'competitions')}>Back to competitions</ActionLink>
      </Card>
    );
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Checkout"
        title="Select tickets"
        description="Mocked mobile equivalent of the web ticket and checkout flow."
      />
      <Card>
        <h3>{competition.name}</h3>
        <div className="quantity-row">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
            -
          </button>
          <strong>{quantity}</strong>
          <button type="button" onClick={() => setQuantity((value) => value + 1)}>
            +
          </button>
        </div>
        <StatPill label="Total" value={`€${total}`} />
        <ActionLink
          to={withLocale(
            locale,
            `competitions/${competition.id}/${params.orderId ?? 'mock-order'}/confirmation`,
          )}
        >
          Mock confirm order
        </ActionLink>
      </Card>
    </section>
  );
}
