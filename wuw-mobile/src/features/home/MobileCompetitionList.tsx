import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CountdownTimer } from '../../components/CountdownTimer';
import { isHomeCompetitionSoldOut, orderHomeCompetitions } from '../../lib/homeCompetitions';
import { resolveMediaUrl } from '../../lib/resolveMediaUrl';
import { formatGbpCompact } from '../../lib/formatCurrency';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import type { Competition } from '../../types';

interface MobileCompetitionListProps {
  competitions: Competition[];
}

interface ResponsiveCompetitionImageProps {
  src?: string;
  alt: string;
}

function ResponsiveCompetitionImage({ src, alt }: ResponsiveCompetitionImageProps) {
  const [failed, setFailed] = useState(false);
  const trimmed = src?.trim() ?? '';

  useEffect(() => {
    setFailed(false);
  }, [trimmed]);

  if (!trimmed || failed) {
    return (
      <div
        className="mobile-home-competition-media mobile-home-competition-media--fallback"
        aria-hidden
      />
    );
  }

  return (
    <div className="mobile-home-competition-media">
      <img
        src={trimmed}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function MobileCompetitionList({ competitions }: MobileCompetitionListProps) {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const orderedCompetitions = orderHomeCompetitions(competitions);

  return (
    <section
      id="competitions"
      className="mobile-home-competitions"
      aria-labelledby="competitions-title"
    >
      <h2 id="competitions-title" className="sr-only">
        Competitions
      </h2>
      {orderedCompetitions.map((competition) => {
        const isClosed = isHomeCompetitionSoldOut(competition);
        return (
          <article className="mobile-home-competition-card" key={competition.id}>
            <Link
              className="mobile-home-competition-media-link"
              to={withLocale(locale, `competitions/${competition.id}`)}
            >
              <ResponsiveCompetitionImage
                src={resolveMediaUrl(competition.watch.images[0]?.url)}
                alt={competition.watch.images[0]?.alt || competition.name}
              />
              {isClosed ? (
                <>
                  <span className="mobile-home-competition-sold-out-dim" aria-hidden />
                  <span className="mobile-home-competition-sold-out-overlay" aria-hidden>
                    SOLD OUT
                  </span>
                </>
              ) : null}
            </Link>

            <div className="mobile-home-competition-body">
              <h3 className="mobile-home-competition-title">{competition.name.toUpperCase()}</h3>
              <p className="mobile-home-competition-subtitle">SPECIAL 🔥 Super LOW COST Comp!</p>

              <div className="mobile-home-competition-timer" aria-label="Competition countdown">
                <CountdownTimer
                  targetIso={competition.endDate}
                  locale={locale}
                  nowMs={nowMs}
                  scheduleIso={competition.endDate}
                  countdownClassName="mobile-home-competition-countdown"
                  note={
                    <span>
                      or until all tickets are sold out. But never after the draw date
                    </span>
                  }
                />
              </div>

              <dl className="mobile-home-competition-stats">
                <div>
                  <dt>{competition.totalTickets}</dt>
                  <dd>Max tickets</dd>
                </div>
                <div>
                  <dt>{formatGbpCompact(competition.price)}</dt>
                  <dd>Watch Value</dd>
                </div>
                <div>
                  <dt>{formatGbpCompact(competition.ticketPrice)}</dt>
                  <dd>Entry Price</dd>
                </div>
              </dl>

              <Link
                className={
                  isClosed
                    ? 'mobile-home-competition-cta mobile-home-competition-cta--sold-out'
                    : 'mobile-home-competition-cta'
                }
                to={withLocale(locale, `competitions/${competition.id}`)}
              >
                {isClosed ? (
                  'Tickets sold out'
                ) : (
                  <>
                    <span className="mobile-home-competition-cta-label">Get your ticket</span>
                    <span aria-hidden>→</span>
                  </>
                )}
              </Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}
