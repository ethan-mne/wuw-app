import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { formatPastDrawLabel, formatUpcomingDrawLabel } from '../lib/formatDrawScheduleLabel';
import { formatGbpCompact } from '../lib/formatCurrency';
import { resolveMediaUrl } from '../lib/resolveMediaUrl';
import { defaultLocale, isLocale, withLocale } from '../routes/locales';
import { mobileDataService } from '../services/mobileDataService';
import type { Competition, Locale } from '../types';

const DRAW_PAGE_SIZE = 15;

function drawInstantMs(competition: Competition): number {
  const raw = competition.drawingDate ?? competition.endDate;
  return new Date(raw).getTime();
}

/** Merge batches and dedupe by id while keeping chronological order. */
function mergeTimelineAscending(
  prev: Competition[],
  olderChunk: Competition[],
  newerChunk: Competition[],
): Competition[] {
  const map = new Map<string, Competition>();
  for (const c of [...olderChunk, ...prev, ...newerChunk]) {
    map.set(c.id, c);
  }
  return [...map.values()].sort((a, b) => drawInstantMs(a) - drawInstantMs(b));
}

function toTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

function getCountdownParts(drawIso: string, nowMs: number): {
  day: string;
  hour: string;
  min: string;
  sec: string;
} {
  const endMs = new Date(drawIso).getTime();
  const remainingMs = Math.max(endMs - nowMs, 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    day: toTwoDigits(days),
    hour: toTwoDigits(hours),
    min: toTwoDigits(minutes),
    sec: toTwoDigits(seconds),
  };
}

function thumbUrl(competition: Competition): string {
  const fromWatch = resolveMediaUrl(competition.watch.images[0]?.url);
  if (fromWatch) return fromWatch;
  return resolveMediaUrl(competition.competitionImageUrl ?? '');
}

interface ThinThumbProps {
  src: string;
  alt: string;
}

function ThinThumb({ src, alt }: ThinThumbProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="draws-thumb draws-thumb--fallback" aria-hidden />
    );
  }
  return (
    <div className="draws-thumb">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function splitTimeline(competitions: Competition[], nowMs: number) {
  const past: Competition[] = [];
  const upcoming: Competition[] = [];
  for (const c of competitions) {
    const t = drawInstantMs(c);
    if (!Number.isFinite(t)) continue;
    if (t <= nowMs) {
      past.push(c);
    } else {
      upcoming.push(c);
    }
  }
  return { past, upcoming };
}

interface DrawThinRowProps {
  competition: Competition;
  locale: Locale;
  nowMs: number;
  variant: 'past' | 'future';
}

function DrawThinRow({ competition, locale, nowMs, variant }: DrawThinRowProps) {
  const drawIso = competition.drawingDate ?? competition.endDate;
  const isClosed = competition.remainingTickets === 0;
  const label =
    variant === 'past'
      ? formatPastDrawLabel(drawIso, locale, new Date(nowMs))
      : formatUpcomingDrawLabel(drawIso, locale, new Date(nowMs));
  const to = withLocale(locale, `competitions/${competition.id}`);

  return (
    <Link
      className={`draws-thin-row draws-thin-row--${variant}${isClosed ? ' draws-thin-row--closed' : ''}`}
      to={to}
    >
      <ThinThumb src={thumbUrl(competition)} alt={competition.name} />
      <div className="draws-thin-row-body">
        <span className="draws-thin-row-eyebrow">
          {variant === 'past' ? (
            <>
              Past draw<span aria-hidden> · </span>
            </>
          ) : null}
          {isClosed ? 'Sold out' : `${formatGbpCompact(competition.ticketPrice)} entry`}
        </span>
        <h3 className="draws-thin-row-title">{competition.name}</h3>
        <p className="draws-thin-row-time">{label}</p>
      </div>
      <span className="draws-thin-row-chevron" aria-hidden>
        →
      </span>
    </Link>
  );
}

export function DrawsPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  const [timeline, setTimeline] = useState<Competition[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingPast, setLoadingPast] = useState(false);
  const [loadingFuture, setLoadingFuture] = useState(false);
  const [hasMorePast, setHasMorePast] = useState(false);
  const [hasMoreFuture, setHasMoreFuture] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const heroAnchorRef = useRef<HTMLElement | null>(null);
  const pastTriggerRef = useRef<HTMLDivElement | null>(null);
  const futureTriggerRef = useRef<HTMLDivElement | null>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);

  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;

  const hasMorePastRef = useRef(hasMorePast);
  hasMorePastRef.current = hasMorePast;
  const hasMoreFutureRef = useRef(hasMoreFuture);
  hasMoreFutureRef.current = hasMoreFuture;

  const loadingPastRef = useRef(false);
  const loadingFutureRef = useRef(false);
  const didSnapHeroRef = useRef(false);
  /** Captures scroll snapshot before loading older draws for prepend offset restore. */
  const pendingScrollPrependAdjustRef = useRef<{
    prevScrollHeight: number;
    prevScrollTop: number;
  } | null>(null);
  const [prependLayoutVersion, bumpPrependLayoutVersion] = useState(0);

  useEffect(() => {
    const el = document.querySelector('.mobile-content');
    scrollParentRef.current = el instanceof HTMLElement ? el : null;
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const seed = await mobileDataService.listDrawsTimelineSeed({
          takePast: DRAW_PAGE_SIZE,
          takeFuture: DRAW_PAGE_SIZE,
        });

        if (cancelled) {
          return;
        }

        if (!seed) {
          setTimeline([]);
          setHasMorePast(false);
          setHasMoreFuture(false);
          return;
        }

        const merged = mergeTimelineAscending([], seed.past, seed.upcoming);
        setTimeline(merged);
        setHasMorePast(seed.hasMorePast);
        setHasMoreFuture(seed.hasMoreFuture);
      } catch {
        if (!cancelled) {
          setTimeline([]);
          setHasMorePast(false);
          setHasMoreFuture(false);
        }
      } finally {
        if (!cancelled) {
          setLoadingInitial(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMorePast = useCallback(async () => {
    if (loadingInitial || loadingPastRef.current || !hasMorePastRef.current) {
      return;
    }

    const first = timelineRef.current[0];
    if (!first) {
      return;
    }

    const beforeIso = first.drawingDate ?? first.endDate;
    loadingPastRef.current = true;
    setLoadingPast(true);

    const root = scrollParentRef.current ?? document.querySelector('.mobile-content');
    if (root instanceof HTMLElement) {
      pendingScrollPrependAdjustRef.current = {
        prevScrollHeight: root.scrollHeight,
        prevScrollTop: root.scrollTop,
      };
    } else {
      pendingScrollPrependAdjustRef.current = null;
    }

    try {
      const page = await mobileDataService.listDrawsTimelineBefore(
        beforeIso,
        DRAW_PAGE_SIZE,
      );
      if (!page?.items?.length) {
        setHasMorePast(page?.hasMore ?? false);
        pendingScrollPrependAdjustRef.current = null;
        return;
      }

      setTimeline((prev) => mergeTimelineAscending(prev, page.items, []));
      setHasMorePast(page.hasMore);
      bumpPrependLayoutVersion((v) => v + 1);
    } catch {
      pendingScrollPrependAdjustRef.current = null;
    } finally {
      loadingPastRef.current = false;
      setLoadingPast(false);
    }
  }, [loadingInitial]);

  const loadMoreFuture = useCallback(async () => {
    if (loadingInitial || loadingFutureRef.current || !hasMoreFutureRef.current) {
      return;
    }

    const last = timelineRef.current[timelineRef.current.length - 1];
    if (!last) {
      return;
    }

    const afterIso = last.drawingDate ?? last.endDate;
    loadingFutureRef.current = true;
    setLoadingFuture(true);

    try {
      const page = await mobileDataService.listDrawsTimelineAfter(
        afterIso,
        DRAW_PAGE_SIZE,
      );
      if (!page?.items?.length) {
        setHasMoreFuture(page?.hasMore ?? false);
        return;
      }

      setTimeline((prev) => mergeTimelineAscending(prev, [], page.items));
      setHasMoreFuture(page.hasMore);
    } finally {
      loadingFutureRef.current = false;
      setLoadingFuture(false);
    }
  }, [loadingInitial]);

  useEffect(() => {
    if (loadingInitial) {
      return undefined;
    }

    const scrollRoot =
      scrollParentRef.current ?? document.querySelector('.mobile-content');

    const pastEl = pastTriggerRef.current;
    const futureEl = futureTriggerRef.current;
    const rootEl = scrollRoot instanceof Element ? scrollRoot : null;

    const observers: IntersectionObserver[] = [];

    if (pastEl) {
      const obsPast = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          void loadMorePast();
        },
        { root: rootEl, rootMargin: '120px 0px', threshold: 0 },
      );
      obsPast.observe(pastEl);
      observers.push(obsPast);
    }

    if (futureEl) {
      const obsFuture = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          void loadMoreFuture();
        },
        { root: rootEl, rootMargin: '0px 0px 120px', threshold: 0 },
      );
      obsFuture.observe(futureEl);
      observers.push(obsFuture);
    }

    return () => {
      for (const o of observers) {
        o.disconnect();
      }
    };
  }, [loadingInitial, loadMorePast, loadMoreFuture]);

  /** Keep scroll anchored when older draws prepend above viewport. */
  useLayoutEffect(() => {
    const pending = pendingScrollPrependAdjustRef.current;
    if (!pending) {
      return;
    }

    const root = scrollParentRef.current ?? document.querySelector('.mobile-content');
    if (!(root instanceof HTMLElement)) {
      pendingScrollPrependAdjustRef.current = null;
      return;
    }

    const newScrollHeight = root.scrollHeight;
    root.scrollTop = pending.prevScrollTop + (newScrollHeight - pending.prevScrollHeight);
    pendingScrollPrependAdjustRef.current = null;
  }, [prependLayoutVersion]);

  const { past, upcoming } = splitTimeline(timeline, nowMs);
  const hero = upcoming[0];
  const restUpcoming = upcoming.slice(1);
  const drawIsoHero = hero ? hero.drawingDate ?? hero.endDate : '';
  const countdownHero =
    hero && drawIsoHero ? getCountdownParts(drawIsoHero, nowMs) : null;

  useLayoutEffect(() => {
    if (loadingInitial || didSnapHeroRef.current || !hero?.id || !heroAnchorRef.current) {
      return;
    }
    heroAnchorRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    didSnapHeroRef.current = true;
  }, [loadingInitial, hero?.id]);

  if (loadingInitial) {
    return (
      <section className="draws-page page-content-pad" aria-labelledby="draws-title">
        <p className="eyebrow" id="draws-title">
          Draws
        </p>
        <div className="home-competitions-loading" role="status" aria-live="polite">
          <span className="home-competitions-loading-spinner" aria-hidden />
          <span className="sr-only">Loading draws…</span>
        </div>
      </section>
    );
  }

  const heroSoldOut = hero ? hero.remainingTickets === 0 : false;

  return (
    <section className="draws-page page-content-pad" aria-labelledby="draws-title">
      <header className="draws-intro">
        <p className="eyebrow" id="draws-title">
          Draws
        </p>
        <h2 className="draws-intro-headline">Upcoming live draws</h2>
        <p className="draws-intro-sub">
          Scroll up for past results — more load as you scroll. Scroll down for later draws.
        </p>
      </header>

      <div
        ref={pastTriggerRef}
        className="draws-scroll-trigger"
        aria-hidden
        data-load-past-available={hasMorePast ? 'true' : 'false'}
      />

      {loadingPast ? (
        <p className="draws-loading-hint" aria-live="polite">
          Loading older draws…
        </p>
      ) : null}

      {past.length > 0 ? (
        <div className="draws-past-group">
          {past.map((c) => (
            <DrawThinRow
              key={c.id}
              competition={c}
              locale={locale}
              nowMs={nowMs}
              variant="past"
            />
          ))}
        </div>
      ) : null}

      {past.length > 0 && hero ? (
        <p className="draws-divider" role="separator">
          Up next
        </p>
      ) : null}

      {hero ? (
        <>
          <article ref={heroAnchorRef} className="draws-hero-anchor">
            <div className="draws-hero">
              <div className="draws-hero-top">
                <ThinThumb src={thumbUrl(hero)} alt={hero.name} />
                <div className="draws-hero-copy">
                  <span className="draws-hero-label">Next draw</span>
                  <h3 className="draws-hero-title">{hero.name}</h3>
                  <p className="draws-hero-datetime">
                    {formatUpcomingDrawLabel(
                      hero.drawingDate ?? hero.endDate,
                      locale,
                      new Date(nowMs),
                    )}
                  </p>
                </div>
              </div>

              {countdownHero ? (
                <div className="draws-hero-countdown" role="timer" aria-live="off">
                  <div>
                    <strong>{countdownHero.day}</strong>
                    <span>DAY</span>
                  </div>
                  <div>
                    <strong>{countdownHero.hour}</strong>
                    <span>HOUR</span>
                  </div>
                  <div>
                    <strong>{countdownHero.min}</strong>
                    <span>MIN</span>
                  </div>
                  <div>
                    <strong>{countdownHero.sec}</strong>
                    <span>SEC</span>
                  </div>
                </div>
              ) : null}

              <Link
                className={
                  heroSoldOut
                    ? 'draws-hero-cta draws-hero-cta--sold-out'
                    : 'draws-hero-cta'
                }
                to={
                  heroSoldOut
                    ? withLocale(locale, '')
                    : withLocale(locale, `competitions/${hero.id}`)
                }
              >
                {heroSoldOut ? 'Tickets sold out' : 'Competition details →'}
              </Link>
            </div>
          </article>

          {restUpcoming.map((c) => (
            <DrawThinRow
              key={c.id}
              competition={c}
              locale={locale}
              nowMs={nowMs}
              variant="future"
            />
          ))}
        </>
      ) : (
        <p className="draws-empty">No upcoming draws in the schedule right now.</p>
      )}

      {hero && loadingFuture ? (
        <p className="draws-loading-hint draws-loading-hint--footer" aria-live="polite">
          Loading more draws…
        </p>
      ) : null}

      <div
        ref={futureTriggerRef}
        className="draws-scroll-trigger"
        aria-hidden
        data-load-future-available={hasMoreFuture ? 'true' : 'false'}
      />
    </section>
  );
}
