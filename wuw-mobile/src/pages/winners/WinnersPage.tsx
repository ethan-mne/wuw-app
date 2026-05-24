import { Card, PageHeader } from '../../components/ui';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { cacheKeys } from '../../lib/dataCache';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { mobileDataService } from '../../services/mobileDataService';
import type { Winner } from '../../types';

async function loadAllWinners(): Promise<Winner[]> {
  const take = 50;
  const acc: Winner[] = [];
  let skip = 0;

  for (;;) {
    const { data, hasMore } = await mobileDataService.listWinners({ skip, take });
    acc.push(...data);
    if (!hasMore) {
      break;
    }
    skip += take;
  }

  return acc;
}

export function WinnersPage() {
  const { data: winners = [] } = useCachedQuery(cacheKeys.winnersAll, loadAllWinners);

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
