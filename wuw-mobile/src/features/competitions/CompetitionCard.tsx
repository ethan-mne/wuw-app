import { useParams } from 'react-router-dom';

import { ActionLink, Card, StatPill } from '../../components/ui';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import type { Competition } from '../../types';

interface CompetitionCardProps {
  competition: Competition;
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <Card>
      <p className="status-label">{competition.watch.brand}</p>
      <h3>{competition.name}</h3>
      <p>
        {competition.watch.model} · {competition.watch.referenceNumber}
      </p>
      <div className="stats-grid">
        <StatPill label="Ticket" value={`€${competition.ticketPrice}`} />
        <StatPill label="Left" value={competition.remainingTickets} />
      </div>
      <ActionLink to={withLocale(locale, `competitions/${competition.id}`)}>
        View competition
      </ActionLink>
    </Card>
  );
}
