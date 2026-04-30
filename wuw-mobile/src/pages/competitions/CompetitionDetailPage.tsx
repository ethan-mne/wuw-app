import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader, StatPill } from '../../components/ui';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { Competition } from '../../types';

export function CompetitionDetailPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const [competition, setCompetition] = useState<Competition | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (!competition && loading) {
    return <p>Loading competition...</p>;
  }

  if (!competition && !loading) {
    return (
      <Card>
        <h2>Competition not found</h2>
        <ActionLink to={withLocale(locale, 'competitions')}>Back to competitions</ActionLink>
      </Card>
    );
  }
  if (!competition) {
    return null;
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Competition detail"
        title={competition.name}
        description="Mobile adaptation of the web detail page and ticket selection entry."
      />
      <Card>
        <div className="image-placeholder">{competition.watch.model}</div>
        <h3>{competition.watch.brand}</h3>
        <p>
          {competition.watch.condition} · {competition.watch.movement} ·{' '}
          {competition.watch.braceletMaterial}
        </p>
        <div className="stats-grid">
          <StatPill label="Prize" value={`€${competition.price}`} />
          <StatPill label="Ticket" value={`€${competition.ticketPrice}`} />
          <StatPill label="Winners" value={competition.maxWinners} />
        </div>
        <ActionLink to={withLocale(locale, `competitions/${competition.id}/mock-order`)}>
          Select tickets
        </ActionLink>
      </Card>
    </section>
  );
}
