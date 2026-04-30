import { useEffect, useState } from 'react';
import { MobileFooter } from '../components/MobileFooter';
import { MobileCompetitionList } from '../features/home/MobileCompetitionList';
import { defaultLocale } from '../routes/locales';
import { Link } from 'react-router-dom';
import { mobileDataService } from '../services/mobileDataService';
import type { Competition } from '../types';

export function HomePage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  useEffect(() => {
    void mobileDataService
      .listCompetitions()
      .then(setCompetitions)
      .catch(() => setCompetitions([]));
  }, []);

  const showcaseImage = competitions[0]?.watch.images[0]?.url;

  return (
    <section className="home-page" aria-labelledby="home-title">
      <p className="home-community-strip">
        Join our +... Community on <strong>Instagram</strong>
      </p>

      {competitions.length > 0 ? (
        <MobileCompetitionList competitions={competitions} />
      ) : (
        <p>Loading competitions...</p>
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

      <section className="winner-strip" aria-label="Recent winners">
        {[1, 2, 3].map((item) => (
          <article className="winner-tile" key={item}>
            <img src={showcaseImage} alt="Winner showcase" />
            <div className="winner-tile-content">
              <p>Winner of PATEK PHILIPPE AQUANAUT 5167A</p>
              <strong>55k</strong>
              <span>Steve Parienti</span>
              <Link to={`/${defaultLocale}/winners`}>Join the next competition</Link>
            </div>
          </article>
        ))}
      </section>
      <MobileFooter />
    </section>
  );
}
