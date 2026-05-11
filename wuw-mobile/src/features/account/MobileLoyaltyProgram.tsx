import { useNavigate, useParams } from 'react-router-dom';

import { defaultLocale, isLocale, withLocale } from '../../routes/locales';

const MAX_WINCOINS = 100;
const COINS_PER_TICKET = 10;

type MobileLoyaltyProgramProps = {
  wincoins: number;
};

export function MobileLoyaltyProgram({ wincoins }: MobileLoyaltyProgramProps) {
  const params = useParams();
  const navigate = useNavigate();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  const capped = Math.min(MAX_WINCOINS, Math.max(0, wincoins));
  const progressPercent = capped;
  const canUseFreeTicket = wincoins >= MAX_WINCOINS;

  return (
    <section className="loyalty-program" aria-labelledby="loyalty-heading">
      <p className="loyalty-program-brand">WINUWATCH</p>
      <h2 id="loyalty-heading" className="loyalty-program-title">
        <span className="loyalty-program-title-accent">Loyalty</span>{' '}
        <span className="loyalty-program-title-rest">Program</span>
      </h2>

      <button
        type="button"
        className="loyalty-cta"
        disabled={!canUseFreeTicket}
        title={
          canUseFreeTicket
            ? 'Open competitions to use your free ticket'
            : `Earn ${MAX_WINCOINS} Wincoins to unlock (you have ${wincoins})`
        }
        onClick={() => void navigate(withLocale(locale, ''))}
      >
        Use your free ticket
      </button>

      <div className="loyalty-progress-wrap">
        <div
          className="loyalty-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={MAX_WINCOINS}
          aria-valuenow={capped}
          aria-label="Progress toward one free ticket"
        >
          <div
            className="loyalty-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="loyalty-progress-labels">
          <span>0</span>
          <span>100 - 1 free ticket</span>
        </div>
      </div>

      <div className="loyalty-rules">
        <p>{`1 Ticket purchased = ${COINS_PER_TICKET} Wincoins`}</p>
        <p>100 Wincoins = 1 free ticket</p>
      </div>

      <p className="loyalty-disclaimer">
        Please note that the maximum cumulative Wincoins you can hold is 100.
      </p>
    </section>
  );
}
