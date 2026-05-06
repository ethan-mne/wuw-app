import { useEffect, useState } from 'react';
import { MobileFooter } from '../components/MobileFooter';
import { MobileCompetitionList } from '../features/home/MobileCompetitionList';
import { MobileCommunityWon } from '../features/home/MobileCommunityWon';
import { MobileHowToPlay } from '../features/home/MobileHowToPlay';
import { mobileDataService } from '../services/mobileDataService';
import type { Competition, Winner } from '../types';

const WINNERS_PAGE_SIZE = 8;

export function HomePage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void mobileDataService
      .listCompetitions()
      .then(setCompetitions)
      .catch(() => setCompetitions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void mobileDataService
      .listWinners({ skip: 0, take: WINNERS_PAGE_SIZE })
      .then((r) => setWinners(r.data))
      .catch(() => setWinners([]));
  }, []);

  const homeCompetitions = competitions;

  return (
    <section className="home-page" aria-labelledby="home-title">
      <p className="home-community-strip">
        Join our +44k community on {' '}
        <strong>Instagram</strong>.
      </p>

      {loading ? (
        <p>Loading competitions...</p>
      ) : (
        <MobileCompetitionList competitions={homeCompetitions} />
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
