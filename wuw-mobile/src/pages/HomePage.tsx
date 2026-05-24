import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { MobileFooter } from '../components/MobileFooter';
import { CONTACT_INFO } from '../data/contactInfo';
import { joinNextHomeCompetitionPath } from '../lib/homeCompetitions';
import { defaultLocale, isLocale } from '../routes/locales';

import { MobileCompetitionList } from '../features/home/MobileCompetitionList';

import { MobileCommunityWon } from '../features/home/MobileCommunityWon';

import { MobileHowToPlay } from '../features/home/MobileHowToPlay';

import { useCachedQuery } from '../hooks/useCachedQuery';

import { cacheKeys } from '../lib/dataCache';

import { mobileDataService } from '../services/mobileDataService';



const WINNERS_PAGE_SIZE = 8;



export function HomePage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  const { data: competitions = [], isLoading: loadingCompetitions } = useCachedQuery(

    cacheKeys.competitions,

    () => mobileDataService.listCompetitions(),

  );



  const { data: winnersResponse } = useCachedQuery(cacheKeys.winnersHome, () =>

    mobileDataService.listWinners({ skip: 0, take: WINNERS_PAGE_SIZE }),

  );



  const winners = winnersResponse?.data ?? [];

  const loading = loadingCompetitions;
  const joinTo = useMemo(() => {
    if (loadingCompetitions) {
      return null;
    }
    return joinNextHomeCompetitionPath(locale, competitions);
  }, [loadingCompetitions, locale, competitions]);

  return (

    <section className="home-page" aria-labelledby="home-title">

      <p className="home-community-strip">
        Join our +44k community on{' '}
        <a
          className="home-community-strip-link"
          href={CONTACT_INFO.instagramUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Instagram
        </a>
        .
      </p>



      {loading ? (

        <div className="home-competitions-loading" role="status" aria-live="polite">

          <span className="home-competitions-loading-spinner" aria-hidden />

          <span className="sr-only">Loading competitions...</span>

        </div>

      ) : (

        <MobileCompetitionList competitions={competitions} />

      )}



      <header className="home-hero">

        <h1 id="home-title">WINUWATCH IS A GAME OF SKILL AND KNOWLEDGE</h1>

        <h2>

          <span>OUR GOAL IS</span>

          <span>FOR EVERYONE TO WIN</span>

        </h2>

        <p className="home-hero-supporting">THE WATCH OF THEIR DREAMS.</p>

        <p className="home-hero-proof">

          WE&apos;VE GIVEN AWAY 9,444,788 WORTH OF WATCHES. Top-Ranked Globally for

          Unbeatable Winning Chances.

        </p>

      </header>



      <MobileHowToPlay joinTo={joinTo} joinLoading={loadingCompetitions} />



      <MobileCommunityWon
        competitions={competitions}
        winners={winners}
        joinTo={joinTo}
        joinLoading={loadingCompetitions}
      />



      <MobileFooter />

    </section>

  );

}

