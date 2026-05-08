import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui';
import { CompetitionCard } from '../../features/competitions/CompetitionCard';
import { mobileDataService } from '../../services/mobileDataService';
import type { Competition } from '../../types';

export function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void mobileDataService
      .listCompetitions()
      .then(setCompetitions)
      .catch(() => setCompetitions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Competitions"
        title="Current competitions"
        description="Mobile version of the web competitions listing."
      />
      {competitions.length === 0 && loading ? (
        <div className="home-competitions-loading" role="status" aria-live="polite">
          <span className="home-competitions-loading-spinner" aria-hidden />
          <span className="sr-only">Loading competitions...</span>
        </div>
      ) : null}
      {competitions.length === 0 && !loading ? <p>No competitions found.</p> : null}
      {competitions.map((competition) => (
        <CompetitionCard key={competition.id} competition={competition} />
      ))}
    </section>
  );
}
