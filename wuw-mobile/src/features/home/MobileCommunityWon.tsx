import { Link } from 'react-router-dom';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { defaultLocale } from '../../routes/locales';
import type { Competition } from '../../types';

/** Matches `PastCompetitions` / `messages/en.json` (`competition.our_community`, `has_won`, `home.subtitle`). */
const COPY = {
  ourCommunity: 'Our community',
  hasWon: 'has won',
  subtitle:
    'We take pride in meticulously curating a collection of watches that embody sophistication and elegance, sourced from a diverse network of over 260 partners across the world.',
  won: 'Won',
  value: 'Value',
  join: 'Join the next competition',
};

function formatGbp(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function MobileCommunityWon({ competitions }: { competitions: Competition[] }) {
  const now = new Date();
  const past = [...competitions]
    .filter((c) => new Date(c.endDate) < now)
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    .slice(0, 8);

  return (
    <section className="mobile-community-won" aria-labelledby="mobile-community-won-title">
      <div className="mobile-community-won-inner">
        <h2 id="mobile-community-won-title" className="mobile-community-won-heading">
          <span className="mobile-community-won-line">{COPY.ourCommunity}</span>
          <span className="mobile-community-won-accent">{COPY.hasWon}</span>
        </h2>
        <p className="mobile-community-won-subtitle">{COPY.subtitle}</p>

        {past.length > 0 ? (
          <div className="mobile-community-won-strip-wrap">
            <div className="mobile-community-won-strip" role="list">
              {past.map((c) => {
                const img = c.watch.images[0]?.url ?? '';
                const title = `${c.watch.brand} ${c.watch.model}`.trim();
                return (
                  <article key={c.id} className="mobile-community-won-card" role="listitem">
                    <div className="mobile-community-won-card-media">
                      {img ? (
                        <img src={img} alt={title || 'Competition watch'} />
                      ) : (
                        <div className="mobile-community-won-card-placeholder" aria-hidden />
                      )}
                    </div>
                    <div className="mobile-community-won-card-body">
                      <p className="mobile-community-won-card-title">{title}</p>
                      <p className="mobile-community-won-card-won">
                        {COPY.won} {formatDrawDateDdMmYyyy(c.endDate)}
                      </p>
                      <p className="mobile-community-won-card-value">
                        {COPY.value} {formatGbp(c.price)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        <Link className="mobile-community-won-cta" to={`/${defaultLocale}/competitions`}>
          {COPY.join}
        </Link>
      </div>
    </section>
  );
}
