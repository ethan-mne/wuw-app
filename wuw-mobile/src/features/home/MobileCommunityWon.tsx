import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SafeImage } from '../../components/SafeImage';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { formatGbp } from '../../lib/formatCurrency';
import { resolveMediaUrl } from '../../lib/resolveMediaUrl';
import { defaultLocale, isLocale } from '../../routes/locales';
import type { Competition, Winner } from '../../types';

/** Matches `PastCompetitions` / `messages/en.json` (`competition.our_community`, `has_won`, `home.subtitle`). */
const COPY = {
  weUse: 'WE USE',
  tpalElectronicRandomDraw: 'TPAL ELECTRONIC RANDOM DRAW',
  computerizedSystem: 'COMPUTERIZED SYSTEM',
  subtitle:
    'our partner randomdraws uses a third-party random number generator for an impartial and secure winner selection process',
  usesLatestTechnology:
    'Uses the latest technology to pick random winners for your draw in compliance with regulations. This means that you can feel confident that your draw is going to be unbiased and can be trusted.',
  drawCertificateExample: 'Draw certificate example',
  won: 'Won',
  value: 'Value',
  join: 'Join the next competition',
};

function CommunityWonCardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  const trimmed = src.trim();
  if (!trimmed || failed) {
    return <div className="mobile-community-won-card-placeholder" aria-hidden />;
  }
  return (
    <img
      src={trimmed}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function MobileCommunityWon({
  competitions,
  winners = [],
}: {
  competitions: Competition[];
  winners?: Winner[];
}) {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  const now = new Date();
  const past = [...competitions]
    .filter((c) => new Date(c.endDate) < now)
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    .slice(0, 8);
  const fallbackWinners = winners.slice(0, 8);
  const hasCards = past.length > 0 || fallbackWinners.length > 0;
  const slider = hasCards ? (
    <div className="mobile-community-won-slider-outside">
      <div className="mobile-community-won-strip-wrap">
        <div className="mobile-community-won-strip" role="list">
          {past.length > 0
            ? past.map((c) => {
                const img = resolveMediaUrl(c.watch.images[0]?.url);
                const title = `${c.watch.brand} ${c.watch.model}`.trim();
                return (
                  <article key={c.id} className="mobile-community-won-card" role="listitem">
                    <div className="mobile-community-won-card-media">
                      {img ? (
                        <CommunityWonCardImage src={img} alt={title || 'Competition watch'} />
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
                        {COPY.value} {formatGbp(c.price, 0)}
                      </p>
                    </div>
                  </article>
                );
              })
            : fallbackWinners.map((winner) => (
                <article key={winner.id} className="mobile-community-won-card" role="listitem">
                  <div className="mobile-community-won-card-media">
                    {winner.imageUrl ? (
                      <CommunityWonCardImage
                        src={winner.imageUrl}
                        alt={winner.prize || 'Winner prize'}
                      />
                    ) : (
                      <div className="mobile-community-won-card-placeholder" aria-hidden />
                    )}
                  </div>
                  <div className="mobile-community-won-card-body">
                    <p className="mobile-community-won-card-title">{winner.prize}</p>
                    <p className="mobile-community-won-card-won">
                      {COPY.won} {formatDrawDateDdMmYyyy(winner.drawDate)}
                    </p>
                    <p className="mobile-community-won-card-value">{winner.name}</p>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="mobile-community-won-block">
      {slider}
      <section className="mobile-community-won" aria-labelledby="mobile-community-won-title">
        <div className="mobile-community-won-inner">
          <h2 id="mobile-community-won-title" className="mobile-community-won-heading">
            <span className="mobile-community-won-line">{COPY.weUse}</span>
            <span className="mobile-community-won-accent">{COPY.tpalElectronicRandomDraw}</span>
            <span className="mobile-community-won-line">{COPY.computerizedSystem}</span>
          </h2>
          <p className="mobile-community-won-subtitle">{COPY.subtitle}</p>
          <div className="mobile-community-won-certificate">
            <p className="mobile-community-won-certificate-copy">{COPY.usesLatestTechnology}</p>
            <div className="mobile-community-won-certificate-card">
              <p>{COPY.drawCertificateExample}</p>
              <SafeImage
                src="https://d9ylgh2z4lcdz.cloudfront.net/randomdraws-certificate.png"
                alt="Randomdraws draw certificate"
              />
            </div>
          </div>

          <Link className="mobile-community-won-cta" to={`/${locale}`}>
            {COPY.join}
          </Link>
        </div>
      </section>
    </div>
  );
}
