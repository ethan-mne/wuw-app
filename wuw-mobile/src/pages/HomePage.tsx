import { MobileFooter } from '../components/MobileFooter';
import { MobileCompetitionList } from '../features/home/MobileCompetitionList';
import { MobileCommunityWon } from '../features/home/MobileCommunityWon';
import { MobileHowToPlay } from '../features/home/MobileHowToPlay';
import { useCachedQuery } from '../hooks/useCachedQuery';
import { cacheKeys } from '../lib/dataCache';
import { mobileDataService } from '../services/mobileDataService';

const WINNERS_PAGE_SIZE = 8;

export function HomePage() {
  const { data: competitions = [], isLoading: loadingCompetitions } = useCachedQuery(
    cacheKeys.competitions,
    () => mobileDataService.listCompetitions(),
  );

  const { data: winnersResponse } = useCachedQuery(cacheKeys.winnersHome, () =>
    mobileDataService.listWinners({ skip: 0, take: WINNERS_PAGE_SIZE }),
  );

  const winners = winnersResponse?.data ?? [];
  const loading = loadingCompetitions;

  return (
    <section className="home-page" aria-labelledby="home-title">
      <p className="home-community-strip">
        Join our +44k community on {' '}
        <strong>Instagram</strong>.
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

      <MobileHowToPlay />

      <MobileCommunityWon competitions={competitions} winners={winners} />

      <MobileFooter />
    </section>
  );
}
