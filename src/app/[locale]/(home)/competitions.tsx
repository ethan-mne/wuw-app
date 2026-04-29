import { CompetitionVersionTwo } from './competition-item';
import type { CompetitionInterface } from '@/lib/interfaces';

export function Competitions({
  competitions,
}: {
  competitions: CompetitionInterface[];
}) {
  return (
    <div className='grid grid-cols-1 xl:grid-cols-2 gap-[54px]'>
      {competitions.length > 0 &&
        competitions.map((comp, index) => (
          // <Competition key={comp.id} competition={comp} />
          <CompetitionVersionTwo
            key={comp.id}
            competition={comp}
            priority={index === 0}
          />
        ))}
    </div>
  );
}
