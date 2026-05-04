import { Link, useParams } from 'react-router-dom';

import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import type { Competition } from '../../types';

interface MobileCompetitionListProps {
  competitions: Competition[];
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

  return (
    <section className="home-competitions" aria-labelledby="competitions-title">
      <h2 id="competitions-title" className="sr-only">
        Competitions
      </h2>
      {competitions.map((competition) => {
        const isClosed = competition.remainingTickets === 0;

        return (
          <article className="featured-competition-card" key={competition.id}>
            <Link
              className="featured-competition-media"
              to={
                isClosed
                  ? withLocale(locale, 'competitions')
                  : withLocale(locale, `competitions/${competition.id}`)
              }
            >
              <img
                src={competition.watch.images[0]?.url}
                alt={competition.watch.images[0]?.alt || competition.name}
              />
            </Link>

            <div className="featured-competition-body">
              <h3>{competition.name.toUpperCase()}</h3>
              <p className="featured-competition-subtitle">SPECIAL 🔥 Super LOW COST Comp!</p>

              <div className="featured-timer" aria-label="Draw date">
                <strong>{formatDrawDate(competition.endDate)}</strong>
                <span>or until all tickets are sold out. But never after the draw date</span>
              </div>

              <dl className="featured-stats">
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
                className={isClosed ? 'enter-button sold-out' : 'enter-button'}
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
