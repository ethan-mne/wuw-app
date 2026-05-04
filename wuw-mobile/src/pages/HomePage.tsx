import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MobileFooter } from '../components/MobileFooter';
import { MobileCompetitionList } from '../features/home/MobileCompetitionList';
import { MobileCommunityWon } from '../features/home/MobileCommunityWon';
import { MobileHowToPlay } from '../features/home/MobileHowToPlay';
import { defaultLocale } from '../routes/locales';
import { Link } from 'react-router-dom';
import { formatDrawDateDdMmYyyy } from '../lib/formatDrawDate';
import { mobileDataService } from '../services/mobileDataService';
import type { Competition, Winner } from '../types';

const WINNERS_PAGE_SIZE = 8;
const WINNER_STRIP_LOAD_THRESHOLD_PX = 64;

function mergeWinnerPages(
  previous: Winner[],
  page: Winner[],
): Winner[] {
  const seen = new Set(previous.map((w) => w.id));
  const next = [...previous];
  for (const w of page) {
    if (!seen.has(w.id)) {
      seen.add(w.id);
      next.push(w);
    }
  }
  return next;
}

export function HomePage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [winnersHasMore, setWinnersHasMore] = useState(true);
  const [winnersLoadingMore, setWinnersLoadingMore] = useState(false);
  const [winnersInitialLoading, setWinnersInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const winnerStripRef = useRef<HTMLElement | null>(null);
  const winnersRef = useRef<Winner[]>([]);
  const hasMoreRef = useRef(true);
  const fetchInFlightRef = useRef(false);

  winnersRef.current = winners;
  hasMoreRef.current = winnersHasMore;

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
      .then((r) => {
        setWinners(r.data);
        setWinnersHasMore(r.hasMore);
      })
      .catch(() => {
        setWinners([]);
        setWinnersHasMore(false);
      })
      .finally(() => setWinnersInitialLoading(false));
  }, []);

  const fetchNextWinnersPage = useCallback(async () => {
    if (fetchInFlightRef.current || !hasMoreRef.current) {
      return;
    }
    fetchInFlightRef.current = true;
    setWinnersLoadingMore(true);
    try {
      const r = await mobileDataService.listWinners({
        skip: winnersRef.current.length,
        take: WINNERS_PAGE_SIZE,
      });
      setWinners((prev) => mergeWinnerPages(prev, r.data));
      setWinnersHasMore(r.hasMore);
    } catch {
      setWinnersHasMore(false);
    } finally {
      fetchInFlightRef.current = false;
      setWinnersLoadingMore(false);
    }
  }, []);

  const onWinnerStripScroll = useCallback(() => {
    const el = winnerStripRef.current;
    if (!el) {
      return;
    }
    if (el.scrollLeft + el.clientWidth < el.scrollWidth - WINNER_STRIP_LOAD_THRESHOLD_PX) {
      return;
    }
    void fetchNextWinnersPage();
  }, [fetchNextWinnersPage]);

  useLayoutEffect(() => {
    const el = winnerStripRef.current;
    if (!el || !winnersHasMore || winnersLoadingMore || fetchInFlightRef.current) {
      return;
    }
    if (el.scrollWidth > el.clientWidth) {
      return;
    }
    if (winners.length === 0) {
      return;
    }
    void fetchNextWinnersPage();
  }, [winners, winnersHasMore, winnersLoadingMore, fetchNextWinnersPage]);

  const now = new Date();
  const activeCompetitions = competitions.filter((competition) => {
    const start = new Date(competition.startDate);
    return start <= now && new Date(competition.endDate) >= now;
  });
  const sortedByEnd = [...competitions].sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
  );
  const upcomingCompetition = sortedByEnd.find(
    (competition) => new Date(competition.startDate) > now,
  );
  const latestEndedCompetition = [...sortedByEnd]
    .reverse()
    .find((competition) => new Date(competition.endDate) < now);

  const activeSorted = [...activeCompetitions].sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
  );
  const homeCompetitions =
    activeSorted.length > 0
      ? activeSorted
      : upcomingCompetition
        ? [upcomingCompetition]
        : latestEndedCompetition
          ? [latestEndedCompetition]
          : [];
  const fallbackImage = homeCompetitions[0]?.watch.images[0]?.url ?? '';

  return (
    <section className="home-page" aria-labelledby="home-title">
      <p className="home-community-strip">
        Join our +... Community on <strong>Instagram</strong>
      </p>

      {!loading && homeCompetitions.length > 0 ? (
        <MobileCompetitionList competitions={homeCompetitions} />
      ) : (
        <p>{loading ? 'Loading competitions...' : 'No current competition found.'}</p>
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

      <div className="winner-strip-wrap">
        <section
          ref={winnerStripRef}
          className="winner-strip"
          aria-label="Recent winners"
          onScroll={onWinnerStripScroll}
        >
          {winners.map((winner) => (
            <article className="winner-tile" key={winner.id}>
              <img src={winner.imageUrl || fallbackImage} alt={winner.prize} />
              <div className="winner-tile-content">
                <p>Winner of {winner.prize}</p>
                <strong>{formatDrawDateDdMmYyyy(winner.drawDate)}</strong>
                <span>{winner.name}</span>
                <Link to={`/${defaultLocale}/winners`}>Join the next competition</Link>
              </div>
            </article>
          ))}
        </section>
        {winnersLoadingMore ? (
          <p className="winner-strip-loading" aria-live="polite">
            Loading…
          </p>
        ) : null}
        {winners.length === 0 && !winnersInitialLoading && !winnersLoadingMore ? (
          <p className="winner-strip-empty">No winners available yet.</p>
        ) : null}
      </div>

      <MobileCommunityWon competitions={competitions} />

      <MobileFooter />
    </section>
  );
}
