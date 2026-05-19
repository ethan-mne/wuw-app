import { useNavigate } from 'react-router-dom';

import { useDrawAlertPrefs } from '../../hooks/useDrawAlertPrefs';
import { isDrawAlertEligible } from '../../lib/drawAlertEligibility';
import { getMobileSessionToken } from '../../lib/mobileSessionToken';
import type { Competition, Locale } from '../../types';

/** Full “Draw reminders” card (competition detail). */
export function DrawAlertPanel({ competition, locale }: { competition: Competition; locale: Locale }) {
  const navigate = useNavigate();
  const eligible = isDrawAlertEligible(competition, Date.now());
  const p = useDrawAlertPrefs(competition.id, eligible);

  if (!eligible) {
    return null;
  }

  return (
    <div className="competition-detail-draw-alert">
      <h3 className="competition-detail-draw-alert-heading">Draw reminders</h3>
      {p.hasTicket ? (
        <p className="competition-detail-draw-alert-note">
          You have entries in this draw — we will notify this device about 10 minutes before the live
          draw.
        </p>
      ) : p.alertPrefsLoading ? (
        <p className="competition-detail-draw-alert-note">Checking your preferences…</p>
      ) : p.subscribed ? (
        <>
          <p className="competition-detail-draw-alert-note">
            We will notify this device about 10 minutes before the live draw.
          </p>
          <button
            type="button"
            className="action-link secondary"
            disabled={p.busy}
            onClick={() => void p.unsubscribe()}
          >
            Turn off alerts
          </button>
        </>
      ) : (
        <>
          <p className="competition-detail-draw-alert-note">
            Follow this draw even without buying tickets — sign in and we will ping this device ~10
            minutes before the live draw.
          </p>
          <button
            type="button"
            className="checkout-flow-button checkout-flow-button--light"
            disabled={p.busy}
            onClick={() => {
              if (!getMobileSessionToken()) {
                p.navigateToLogin(navigate, locale);
                return;
              }
              void p.subscribe();
            }}
          >
            {getMobileSessionToken() ? 'Notify me before the draw' : 'Sign in for draw alerts'}
          </button>
        </>
      )}
      {p.error ? (
        <p className="competition-detail-draw-alert-error" role="alert">
          {p.error}
        </p>
      ) : null}
    </div>
  );
}

/** Compact reminder block under the draws hero (next draw card). */
export function DrawAlertHeroStrip({
  competition,
  locale,
  nowMs,
}: {
  competition: Competition;
  locale: Locale;
  nowMs: number;
}) {
  const navigate = useNavigate();
  const eligible = isDrawAlertEligible(competition, nowMs);
  const p = useDrawAlertPrefs(competition.id, eligible);

  if (!eligible) {
    return null;
  }

  if (p.hasTicket) {
    return null;
  }

  const remindLabel = 'Get a push about 10 minutes before this live draw';

  return (
    <div className="draws-hero-draw-alert">
      {p.alertPrefsLoading ? (
        <button
          type="button"
          className="draws-hero-draw-alert-btn"
          disabled
          aria-busy="true"
          aria-label={remindLabel}
        >
          Remind me
        </button>
      ) : p.subscribed ? (
        <button
          type="button"
          className="draws-hero-draw-alert-btn draws-hero-draw-alert-btn--secondary"
          disabled={p.busy}
          onClick={() => void p.unsubscribe()}
        >
          Turn off alert
        </button>
      ) : (
        <button
          type="button"
          className="draws-hero-draw-alert-btn"
          disabled={p.busy}
          aria-label={remindLabel}
          onClick={() => {
            if (!getMobileSessionToken()) {
              p.navigateToLogin(navigate, locale);
              return;
            }
            void p.subscribe();
          }}
        >
          {getMobileSessionToken() ? 'Remind me' : 'Sign in to be reminded'}
        </button>
      )}
      {p.error ? (
        <p className="draws-hero-draw-alert-error" role="alert">
          {p.error}
        </p>
      ) : null}
    </div>
  );
}

/** Compact inline reminder on upcoming draw rows (between title and chevron). */
export function DrawThinRowAlertButton({
  competition,
  locale,
  nowMs,
}: {
  competition: Competition;
  locale: Locale;
  nowMs: number;
}) {
  const navigate = useNavigate();
  const eligible = isDrawAlertEligible(competition, nowMs);
  const p = useDrawAlertPrefs(competition.id, eligible);

  if (!eligible) {
    return null;
  }

  const session = getMobileSessionToken();
  const loadingGate = Boolean(session) && p.alertPrefsLoading;
  const remindLabel = 'Get a push about 10 minutes before this live draw';

  const btnClass = 'draws-thin-row-remind-btn draws-thin-row-remind-btn--inline';

  if (p.hasTicket) {
    return (
      <span
        className="draws-thin-row-remind-inline draws-thin-row-remind-inline--tick"
        title="We will remind you before this draw"
      >
        ✓
      </span>
    );
  }

  return (
    <div className="draws-thin-row-remind-inline">
      {loadingGate ? (
        <button
          type="button"
          className={btnClass}
          disabled
          aria-busy="true"
          aria-label={remindLabel}
          title={remindLabel}
        >
          …
        </button>
      ) : p.subscribed ? (
        <button
          type="button"
          className={`${btnClass} draws-thin-row-remind-btn--secondary`}
          disabled={p.busy}
          aria-label="Turn off draw reminder for this competition"
          title={p.error || 'Turn off reminder'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void p.unsubscribe();
          }}
        >
          Off
        </button>
      ) : (
        <button
          type="button"
          className={btnClass}
          disabled={p.busy}
          aria-label={remindLabel}
          title={p.error || remindLabel}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!session) {
              p.navigateToLogin(navigate, locale);
              return;
            }
            void p.subscribe();
          }}
        >
          {session ? 'Remind me' : 'Sign in'}
        </button>
      )}
      {p.error ? (
        <span className="sr-only" role="alert">
          {p.error}
        </span>
      ) : null}
    </div>
  );
}
