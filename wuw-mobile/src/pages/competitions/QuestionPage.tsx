import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Card } from '../../components/ui';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { Competition } from '../../types';
import {
  CHECKOUT_FLOW_DEFAULTS,
  CHECKOUT_QUESTION_OPTIONS,
  type CheckoutFlowState,
} from './checkoutFlow';

const QUESTION_TIME_LIMIT_SEC = 40;

export function QuestionPage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const flowState = (location.state as CheckoutFlowState | undefined) ?? CHECKOUT_FLOW_DEFAULTS;
  const [competition, setCompetition] = useState<Competition | undefined>();
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(flowState.answer);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_LIMIT_SEC);

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

  const goToCheckout = (timedOut = false) => {
    if (!params.id) {
      navigate(withLocale(locale, 'competitions'));
      return;
    }
    navigate(withLocale(locale, `competitions/${params.id}/draft-order`), {
      state: {
        quantity: Math.max(1, flowState.quantity ?? 1),
        answer: selectedAnswer,
        discountPercent: flowState.discountPercent ?? 0,
        timedOut,
      } satisfies CheckoutFlowState,
    });
  };

  useEffect(() => {
    if (secondsLeft <= 0) {
      goToCheckout(true);
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const watchName = useMemo(() => {
    if (!competition) {
      return 'this watch';
    }
    return `${competition.watch.brand} ${competition.watch.model}`.trim();
  }, [competition]);

  if (loading) {
    return <p>Loading challenge...</p>;
  }

  if (!competition) {
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

  return (
    <section className="checkout-flow-page">
      <Card>
        <div className="checkout-flow-eyebrow">Connoisseur challenge</div>
        <h2 className="checkout-flow-title">What watch is this?</h2>
        <p className="checkout-flow-question-subtitle">
          Win the {watchName}. Select your answer before the timer ends.
        </p>
        <p className="checkout-flow-timer">Time remaining: {secondsLeft}s</p>

        <div className="checkout-flow-question-image-wrap">
          <img
            src={competition.watch.images[0]?.url ?? ''}
            alt={watchName}
            className="checkout-flow-question-image"
          />
          <span className="checkout-flow-question-watermark">Challenge</span>
        </div>

        <div className="checkout-flow-question-options">
          {CHECKOUT_QUESTION_OPTIONS.map((option) => {
            const checked = option === selectedAnswer;
            return (
              <label
                key={option}
                className={`checkout-flow-question-option${checked ? ' active' : ''}`}
              >
                <input
                  type="radio"
                  name="competition-question"
                  checked={checked}
                  onChange={() => setSelectedAnswer(option)}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          className="checkout-flow-button"
          disabled={!selectedAnswer}
          onClick={() => goToCheckout(false)}
        >
          Continue to checkout
        </button>
      </Card>
    </section>
  );
}
