import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Card } from '../../components/ui';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { Competition } from '../../types';

export function CompetitionDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const [competition, setCompetition] = useState<Competition | undefined>();
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const ticketPrice = competition?.ticketPrice ?? 0;
  const totalPrice = useMemo(() => (ticketPrice * quantity).toFixed(2), [ticketPrice, quantity]);

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

  if (!competition && loading) {
    return <p>Loading competition...</p>;
  }

  if (!competition && !loading) {
    return (
      <Card>
        <h2>Competition not found</h2>
        <button
          type="button"
          className="checkout-flow-button"
          onClick={() => navigate(withLocale(locale, 'competitions'))}
        >
          Back to competitions
        </button>
      </Card>
    );
  }
  if (!competition) {
    return null;
  }

  const watchName = `${competition.watch.brand} ${competition.watch.model}`.trim();
  const imageUrl = competition.watch.images[0]?.url ?? '';
  const onContinue = () => {
    navigate(withLocale(locale, `competitions/${competition.id}/question`), {
      state: {
        quantity,
        answer: null,
      },
    });
  };

  return (
    <section className="checkout-flow-page">
      <Card>
        <div className="checkout-flow-eyebrow">Competition detail</div>
        <h2 className="checkout-flow-title">Win the {watchName}</h2>

        <div className="checkout-flow-hero">
          {imageUrl ? (
            <img src={imageUrl} alt={watchName} className="checkout-flow-hero-image" />
          ) : (
            <div className="checkout-flow-hero-image checkout-flow-hero-image--placeholder">
              {competition.watch.model}
            </div>
          )}
        </div>

        <div className="checkout-flow-meta">
          <div>
            <span>Watch Value</span>
            <strong>GBP {competition.price.toFixed(2)}</strong>
          </div>
          <div>
            <span>Entry Price</span>
            <strong>GBP {competition.ticketPrice.toFixed(2)}</strong>
          </div>
          <div>
            <span>Draw Date</span>
            <strong>{formatDrawDateDdMmYyyy(competition.endDate)}</strong>
          </div>
        </div>

        <div className="checkout-flow-select-header">
          <h3>Select your ticket</h3>
          <p>How many tickets would you like?</p>
        </div>
        <div className="checkout-flow-quantity-picker" role="group" aria-label="Ticket quantity">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <strong>{quantity}</strong>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(50, value + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <p className="checkout-flow-quantity-note">Maximum 50 tickets per player.</p>
        <div className="checkout-flow-total">Current total: GBP {totalPrice}</div>

        <button type="button" className="checkout-flow-button" onClick={onContinue}>
          Continue to the next step
        </button>
      </Card>
    </section>
  );
}
