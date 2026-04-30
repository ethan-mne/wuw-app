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
  const featuredCompetition = competitions[0];
  const isClosed = featuredCompetition.remainingTickets === 0;

  return (
    <section className="home-competitions" aria-labelledby="competitions-title">
      <h2 id="competitions-title" className="sr-only">
        Competitions
      </h2>
      <article className="featured-competition-card">
        <Link
          className="featured-competition-media"
          to={
            isClosed
              ? withLocale(locale, 'competitions')
              : withLocale(locale, `competitions/${featuredCompetition.id}`)
          }
        >
          <img
            src={featuredCompetition.watch.images[0]?.url}
            alt={featuredCompetition.watch.images[0]?.alt || featuredCompetition.name}
          />
        </Link>

        <div className="featured-competition-body">
          <h3>{featuredCompetition.name.toUpperCase()}</h3>
          <p className="featured-competition-subtitle">SPECIAL 🔥 Super LOW COST Comp!</p>

          <div className="featured-timer" aria-label="Draw date">
            <strong>{formatDrawDate(featuredCompetition.endDate)}</strong>
            <span>or until all tickets are sold out. But never after the draw date</span>
          </div>

          <dl className="featured-stats">
            <div>
              <dt>{featuredCompetition.totalTickets}</dt>
              <dd>Max tickets</dd>
            </div>
            <div>
              <dt>{formatCurrency(featuredCompetition.price)}</dt>
              <dd>Watch Value</dd>
            </div>
            <div>
              <dt>{formatCurrency(featuredCompetition.ticketPrice)}</dt>
              <dd>Entry Price</dd>
            </div>
          </dl>

          <Link
            className={isClosed ? 'enter-button sold-out' : 'enter-button'}
            to={
              isClosed
                ? withLocale(locale, 'competitions')
                : withLocale(locale, `competitions/${featuredCompetition.id}`)
            }
          >
            {isClosed ? 'Tickets sold out' : 'Get your ticket'}
          </Link>
        </div>
      </article>

      <div className="home-section-title">
        <p className="eyebrow">Competitions</p>
        <h2>Enter this competition</h2>
      </div>

      <div className="web-like-competition-grid">
        {competitions.map((competition, index) => {
          const competitionIsClosed = competition.remainingTickets === 0;

          return (
            <article className="web-like-competition-card" key={competition.id}>
              <div className="timer-strip" aria-label="Draw date">
                Draw date · {formatDrawDate(competition.endDate)}
              </div>

              <Link
                className="competition-row-link"
                to={
                  competitionIsClosed
                    ? withLocale(locale, 'competitions')
                    : withLocale(locale, `competitions/${competition.id}`)
                }
              >
                <div className="competition-thumb">
                  <span>{competition.watch.brand}</span>
                </div>

                <div className="competition-main">
                  <p className="competition-index">Competition #{index + 1}</p>
                  <h3>{competition.name}</h3>
                  <div className="competition-meta">
                    <span>{competition.totalTickets} max tickets</span>
                    <span>{formatCurrency(competition.price)} watch value</span>
                    <span>{formatDrawDate(competition.endDate)}</span>
                  </div>
                </div>

                <div className="ticket-price-block">
                  <span>Ticket price</span>
                  <strong>{formatCurrency(competition.ticketPrice)}</strong>
                </div>
              </Link>

              <Link
                className={competitionIsClosed ? 'enter-button sold-out' : 'enter-button'}
                to={
                  competitionIsClosed
                    ? withLocale(locale, 'competitions')
                    : withLocale(locale, `competitions/${competition.id}`)
                }
              >
                {competitionIsClosed ? 'Tickets sold out' : 'Enter this competition'}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
