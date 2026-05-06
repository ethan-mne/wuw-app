import { Link, useParams } from 'react-router-dom';

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
  if (!src) {
    return (
      <div
        className="mobile-home-competition-media mobile-home-competition-media--fallback"
        aria-hidden
      />
    );
  }

  return (
    <div className="mobile-home-competition-media">
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GB', {
    currency: 'GBP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatDrawDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function MobileCompetitionList({ competitions }: MobileCompetitionListProps) {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
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

        return (
          <article className="mobile-home-competition-card" key={competition.id}>
            <Link
              className="mobile-home-competition-media-link"
              to={
                isClosed
                  ? withLocale(locale, 'competitions')
                  : withLocale(locale, `competitions/${competition.id}`)
              }
            >
              <ResponsiveCompetitionImage
                src={competition.watch.images[0]?.url}
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

              <div className="mobile-home-competition-timer" aria-label="Draw date">
                <strong>{formatDrawDate(competition.endDate)}</strong>
                <span>or until all tickets are sold out. But never after the draw date</span>
              </div>

              <dl className="mobile-home-competition-stats">
                <div>
                  <dt>{competition.totalTickets}</dt>
                  <dd>Max tickets</dd>
                </div>
                <div>
                  <dt>{formatCurrency(competition.price)}</dt>
                  <dd>Watch Value</dd>
                </div>
                <div>
                  <dt>{formatCurrency(competition.ticketPrice)}</dt>
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
                    ? withLocale(locale, 'competitions')
                    : withLocale(locale, `competitions/${competition.id}`)
                }
              >
                {isClosed ? 'Tickets sold out' : 'Get your ticket'}
              </Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}
