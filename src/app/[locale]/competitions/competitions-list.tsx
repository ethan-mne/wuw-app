/*  eslint-disable  */
import { Fragment } from 'react';
import { CompetitionItem } from './competition-item';
import { CompetitionInterface } from '@/lib/interfaces';
import { useTranslations } from 'next-intl';

export async function CompetitionsList({
  currentCompetitions,
}: {
  currentCompetitions: CompetitionInterface[];
}) {
  const Tcompetition = useTranslations('competition');

  return (
    <Fragment>
      {currentCompetitions.length > 0 ? (
        currentCompetitions.map((comp, index) => (
          <CompetitionItem key={comp.id} competition={comp} index={index + 1} />
        ))
      ) : (
        <p> {Tcompetition('no_competitions_found')}...</p>
      )}
    </Fragment>
  );
}
