import { useEffect, useState } from 'react';
import { Card, PageHeader } from '../../components/ui';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { mobileDataService } from '../../services/mobileDataService';
import type { Winner } from '../../types';

export function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    let cancelled = false;
    const take = 50;

    async function loadAll() {
      const acc: Winner[] = [];
      let skip = 0;
      try {
        for (;;) {
          const { data, hasMore } = await mobileDataService.listWinners({ skip, take });
          if (cancelled) {
            return;
          }
          acc.push(...data);
          if (!hasMore) {
            break;
          }
          skip += take;
        }
        if (!cancelled) {
          setWinners(acc);
        }
      } catch {
        if (!cancelled) {
          setWinners([]);
        }
      }
    }

    void loadAll();
    return () => {
      cancelled = true;
    };
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
            Won {winner.prize} on {formatDrawDateDdMmYyyy(winner.drawDate)}
          </p>
        </Card>
      ))}
    </section>
  );
}
