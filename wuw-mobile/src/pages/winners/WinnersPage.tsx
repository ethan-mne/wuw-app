import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { cacheKeys } from '../../lib/dataCache';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
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
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const { data: winners = [] } = useCachedQuery(cacheKeys.winnersAll, loadAllWinners);

  return (
    <section className="page-stack page-content-pad">
      <PageHeader
        eyebrow="Winners"
        title="Recent winners"
        description="Mobile version of the web winners page."
      />
      <ActionLink to={withLocale(locale, '')}>Browse live competitions</ActionLink>
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
