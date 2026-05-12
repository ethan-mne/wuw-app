import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Card } from '../../components/ui';
import { INFORMATIVE_ONLY_MODE } from '../../config/informativeOnlyMode';
import { CHALLENGE_QUESTIONS, CHALLENGE_QUESTION_COUNT } from '../../data/challengeQuestions';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { Competition } from '../../types';
import { CHECKOUT_FLOW_DEFAULTS, type CheckoutFlowState } from './checkoutFlow';

const QUESTION_TIME_LIMIT_SEC = 40;

function rotateOptions<T>(items: readonly T[], offset: number): T[] {
  const n = items.length;
  if (n === 0) return [];
  const k = ((offset % n) + n) % n;
  return [...items.slice(k), ...items.slice(0, k)];
}

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
  const [questionRound, setQuestionRound] = useState(0);
  const [challengeImageFailed, setChallengeImageFailed] = useState(false);

  useEffect(() => {
    if (!INFORMATIVE_ONLY_MODE) return;
    const id = params.id;
    const target =
      id !== undefined && id !== ''
        ? withLocale(locale, `competitions/${id}`)
        : withLocale(locale, '');
    navigate(target, { replace: true });
  }, [locale, navigate, params.id]);

  useEffect(() => {
    if (INFORMATIVE_ONLY_MODE) return;
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

  const goToCheckout = () => {
    if (!params.id) {
      navigate(withLocale(locale, ''));
      return;
    }
    navigate(withLocale(locale, `competitions/${params.id}/draft-order`), {
      state: {
        quantity: Math.max(1, flowState.quantity ?? 1),
        answer: selectedAnswer,
        discountPercent: flowState.discountPercent ?? 0,
        timedOut: false,
      } satisfies CheckoutFlowState,
    });
  };

  useEffect(() => {
    if (secondsLeft <= 0) {
      setQuestionRound((r) => r + 1);
      setSecondsLeft(QUESTION_TIME_LIMIT_SEC);
      setSelectedAnswer(null);
      return;
    }
    const id = window.setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const activeQuestion = useMemo(
    () => CHALLENGE_QUESTIONS[questionRound % CHALLENGE_QUESTION_COUNT],
    [questionRound],
  );

  /** Only one horizontal half of the photo is shown; alternates each round. */
  const challengeImageHalf = questionRound % 2 === 0 ? 'top' : 'bottom';

  useEffect(() => {
    setChallengeImageFailed(false);
  }, [activeQuestion.id, activeQuestion.imageSrc]);

  if (loading) {
    return (
      <div className="home-competitions-loading" role="status" aria-live="polite">
        <span className="home-competitions-loading-spinner" aria-hidden />
        <span className="sr-only">Loading challenge</span>
      </div>
    );
  }

  if (!competition) {
    return (
      <Card>
        <h2>Competition not found</h2>
        <button
          type="button"
          className="checkout-flow-button"
          onClick={() => navigate(withLocale(locale, ''))}
        >
          Back to home
        </button>
      </Card>
    );
  }

  return (
    <section className="checkout-flow-page">
      <Card>
        <div className="checkout-flow-eyebrow">Connoisseur challenge</div>
        <h2 className="checkout-flow-title">{activeQuestion.prompt}</h2>
        <p className="checkout-flow-timer">Time remaining: {secondsLeft}s</p>

        <div
          className="checkout-flow-question-image-wrap"
          aria-live="polite"
          role="img"
          aria-label={activeQuestion.alt}
        >
          <div
            className="checkout-flow-question-half-view"
            key={`${questionRound}-${activeQuestion.id}-${challengeImageHalf}`}
          >
            {!challengeImageFailed ? (
              <img
                src={activeQuestion.imageSrc}
                alt=""
                aria-hidden={true}
                className={`checkout-flow-question-half-img checkout-flow-question-half-img--${challengeImageHalf}`}
                decoding="async"
                onError={() => setChallengeImageFailed(true)}
              />
            ) : null}
          </div>
          <span className="checkout-flow-question-watermark">Challenge</span>
        </div>

        <div className="checkout-flow-question-options" key={questionRound}>
          {rotateOptions(activeQuestion.options, questionRound).map((option) => {
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
          onClick={() => goToCheckout()}
        >
          Continue to checkout
        </button>
      </Card>
    </section>
  );
}
