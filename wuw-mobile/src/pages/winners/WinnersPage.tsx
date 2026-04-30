import { useEffect, useState } from 'react';
import { Card, PageHeader } from '../../components/ui';
import { mobileDataService } from '../../services/mobileDataService';
import type { Winner } from '../../types';

export function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    void mobileDataService.listWinners().then(setWinners).catch(() => setWinners([]));
  }, []);

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Winners"
        title="Recent winners"
        description="Mobile version of the web winners page."
      />
      {winners.map((winner) => (
        <Card key={winner.id}>
          <p className="status-label">{winner.location}</p>
          <h3>{winner.name}</h3>
          <p>
            Won {winner.prize} on {winner.drawDate}
          </p>
        </Card>
      ))}
    </section>
  );
}
