import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

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

type CountdownParts = {
  day: string;
  hour: string;
  min: string;
  sec: string;
};

function toTwoDigits(value: number) {
  return String(value).padStart(2, '0');
}

function getCountdownParts(endDate: string, nowMs: number): CountdownParts {
  const endMs = new Date(endDate).getTime();
  const remainingMs = Math.max(endMs - nowMs, 0);
  const totalSeconds = Math.floor(remainingMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    day: toTwoDigits(days),
    hour: toTwoDigits(hours),
    min: toTwoDigits(minutes),
    sec: toTwoDigits(seconds),
  };
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

  const orderedCompetitions = [...competitions].sort((a, b) => {
    const aSoldOut = a.remainingTickets === 0;
    const bSoldOut = b.remainingTickets === 0;
    if (aSoldOut === bSoldOut) {
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
    return aSoldOut ? 1 : -1;
  });

  return (
    <section className="mobile-home-competitions" aria-labelledby="competitions-title">
      <h2 id="competitions-title" className="sr-only">
        Competitions
      </h2>
      {orderedCompetitions.map((competition) => {
        const isClosed = competition.remainingTickets === 0;
        const countdown = getCountdownParts(competition.endDate, nowMs);

        return (
          <article className="mobile-home-competition-card" key={competition.id}>
            <Link
              className="mobile-home-competition-media-link"
              to={
                isClosed
                  ? withLocale(locale, '')
                  : withLocale(locale, `competitions/${competition.id}`)
              }
            >
              <ResponsiveCompetitionImage
                src={resolveMediaUrl(competition.watch.images[0]?.url)}
                alt={competition.watch.images[0]?.alt || competition.name}
              />
              {isClosed ? (
                <span className="mobile-home-competition-sold-out-overlay" aria-hidden>
                  SOLD OUT
                </span>
              ) : null}
            </Link>

            <div className="mobile-home-competition-body">
              <h3 className="mobile-home-competition-title">{competition.name.toUpperCase()}</h3>
              <p className="mobile-home-competition-subtitle">SPECIAL 🔥 Super LOW COST Comp!</p>

              <div className="mobile-home-competition-timer" aria-label="Competition countdown">
                <div className="mobile-home-competition-countdown" role="timer" aria-live="off">
                  <div>
                    <strong>{countdown.day}</strong>
                    <span>DAY</span>
                  </div>
                  <div>
                    <strong>{countdown.hour}</strong>
                    <span>HOUR</span>
                  </div>
                  <div>
                    <strong>{countdown.min}</strong>
                    <span>MIN</span>
                  </div>
                  <div>
                    <strong>{countdown.sec}</strong>
                    <span>SEC</span>
                  </div>
                </div>
                <span>or until all tickets are sold out. But never after the draw date</span>
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
                to={
                  isClosed
                    ? withLocale(locale, '')
                    : withLocale(locale, `competitions/${competition.id}`)
                }
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
