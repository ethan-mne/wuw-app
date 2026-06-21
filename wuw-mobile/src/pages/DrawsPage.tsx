import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { DrawAlertHeroStrip, DrawThinRowAlertButton } from '../features/draws/DrawAlertViews';
import { CountdownTimer } from '../components/CountdownTimer';
import {
  findHeroLiveBufferDraw,
  isDrawAlertEligible,
} from '../lib/drawAlertEligibility';

import { formatPastDrawLabel, formatUpcomingDrawLabel } from '../lib/formatDrawScheduleLabel';
import { formatGbpCompact } from '../lib/formatCurrency';
import { competitionThumbUrl } from '../lib/competitionThumbUrl';
import { cacheKeys, getCachedData } from '../lib/dataCache';
import { useCachedQuery } from '../hooks/useCachedQuery';
import { defaultLocale, isLocale, withLocale } from '../routes/locales';
import { mobileDataService, type DrawsTimelineSeed } from '../services/mobileDataService';
import type { Competition, Locale } from '../types';

const DRAW_FUTURE_PAGE_SIZE = 15;
/** Matches server `MOBILE_DRAWS_MAX_PAST` — only recent past draws in the seed. */
const DRAW_PAST_LIMIT = 3;
/**
 * Max past rows rendered (newest-first among past). Competitions promoted from upcoming to
 * past as clocks tick otherwise flood this list despite a small seed.
 */
const DRAW_PAST_DISPLAY_LIMIT = 5;
/** If older draws are ever fetched, keep batches small — do not reuse future page size (15). */
const DRAW_PAST_PAGE_SIZE = 6;

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

function ThinThumb({ competition, alt }: { competition: Competition; alt: string }) {
  const [failed, setFailed] = useState(false);
  const src = competitionThumbUrl(competition);
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
  const liveBufferDraw = findHeroLiveBufferDraw(competitions, nowMs);
  for (const c of competitions) {
    const t = drawInstantMs(c);
    if (!Number.isFinite(t)) continue;
    if (t > nowMs || liveBufferDraw?.id === c.id) {
      upcoming.push(c);
    } else {
      past.push(c);
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

const LOCAL_TIME_SPLIT = ' · ';

function DrawThinRowScheduleTime({ label }: { label: string }) {
  const splitAt = label.indexOf(LOCAL_TIME_SPLIT);
  if (splitAt === -1) {
    return (
      <p className="draws-thin-row-time">
        <span className="draws-thin-row-time-line">{label}</span>
      </p>
    );
  }

  const firstLine = label.slice(0, splitAt);
  const secondLine = label.slice(splitAt + LOCAL_TIME_SPLIT.length);

  return (
    <p className="draws-thin-row-time">
      <span className="draws-thin-row-time-line">{firstLine} ·</span>
      <span className="draws-thin-row-time-line">{secondLine}</span>
    </p>
  );
}

function DrawThinRow({ competition, locale, nowMs, variant }: DrawThinRowProps) {
  const drawIso = competition.drawingDate ?? competition.endDate;
  const isClosed = competition.remainingTickets === 0;
  const label =
    variant === 'past'
      ? formatPastDrawLabel(drawIso, locale, new Date(nowMs))
      : formatUpcomingDrawLabel(drawIso, locale, new Date(nowMs));
  const to = withLocale(locale, `competitions/${competition.id}`);
  const showAlert = variant === 'future' && isDrawAlertEligible(competition, nowMs);

  const rowText = (
    <>
      <span className="draws-thin-row-eyebrow">
        {variant === 'past' ? (
          <>
            Past draw<span aria-hidden> · </span>
          </>
        ) : null}
        {isClosed ? 'Sold out' : `${formatGbpCompact(competition.ticketPrice)} entry`}
      </span>
      <h3 className="draws-thin-row-title">{competition.name}</h3>
      <DrawThinRowScheduleTime label={label} />
    </>
  );

  if (!showAlert) {
    return (
      <Link
        className={`draws-thin-row draws-thin-row--${variant}${isClosed ? ' draws-thin-row--closed' : ''}`}
        to={to}
      >
        <ThinThumb competition={competition} alt={competition.name} />
        <div className="draws-thin-row-body">{rowText}</div>
        <span className="draws-thin-row-chevron" aria-hidden>
          →
        </span>
      </Link>
    );
  }

  return (
    <div
      className={`draws-thin-row-card draws-thin-row-card--${variant}${isClosed ? ' draws-thin-row-card--closed' : ''}`}
    >
      <div className="draws-thin-row-card-main">
        <div className="draws-thin-row-card-leading">
          <Link
            className="draws-thin-row-card-thumb-link"
            to={to}
            aria-label={`${competition.name} — open details`}
          >
            <ThinThumb competition={competition} alt={competition.name} />
          </Link>
          <div className="draws-thin-row-body">
            <Link className="draws-thin-row-card-chevron" to={to} aria-label={`${competition.name} — open details`}>
              <span aria-hidden>→</span>
            </Link>
            <Link className="draws-thin-row-card-text-link" to={to}>
              {rowText}
            </Link>
            <DrawThinRowAlertButton competition={competition} locale={locale} nowMs={nowMs} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DrawsPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  const drawsSeedKey = cacheKeys.drawsSeed(DRAW_PAST_LIMIT, DRAW_FUTURE_PAGE_SIZE);
  const { data: seed, isLoading: loadingInitial } = useCachedQuery(drawsSeedKey, () =>
    mobileDataService.listDrawsTimelineSeed({
      takePast: DRAW_PAST_LIMIT,
      takeFuture: DRAW_FUTURE_PAGE_SIZE,
    }),
  );

  const [timeline, setTimeline] = useState<Competition[]>(() => {
    const cached = getCachedData<DrawsTimelineSeed | null>(drawsSeedKey);
    if (!cached) {
      return [];
    }
    return mergeTimelineAscending([], cached.past, cached.upcoming);
  });
  const [loadingPast, setLoadingPast] = useState(false);
  const [loadingFuture, setLoadingFuture] = useState(false);
  const [hasMorePast, setHasMorePast] = useState(false);
  const [hasMoreFuture, setHasMoreFuture] = useState(() => {
    const cached = getCachedData<DrawsTimelineSeed | null>(drawsSeedKey);
    return cached?.hasMoreFuture ?? false;
  });
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
    if (loadingInitial) {
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
    setHasMorePast(false);
    setHasMoreFuture(seed.hasMoreFuture);
  }, [seed, loadingInitial]);

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
        DRAW_PAST_PAGE_SIZE,
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
        DRAW_FUTURE_PAGE_SIZE,
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
  /** Newest draws sit at the end of `past` — keep UI to a short “recent results” strip. */
  const pastDisplayed =
    past.length <= DRAW_PAST_DISPLAY_LIMIT ? past : past.slice(-DRAW_PAST_DISPLAY_LIMIT);
  const hero = upcoming[0];
  const restUpcoming = upcoming.slice(1);
  const drawIsoHero = hero ? hero.drawingDate ?? hero.endDate : '';
  const showHeroCountdown = Boolean(hero && drawIsoHero);

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
          When shown, finished draws appear first, followed by upcoming ones below.
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

      {pastDisplayed.length > 0 ? (
        <div className="draws-past-group">
          {pastDisplayed.map((c) => (
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

      {pastDisplayed.length > 0 && hero ? (
        <p className="draws-divider" role="separator">
          Up next
        </p>
      ) : null}

      {hero ? (
        <>
          <article ref={heroAnchorRef} className="draws-hero-anchor">
            <div className="draws-hero">
              <Link
                className="draws-hero-media"
                to={withLocale(locale, `competitions/${hero.id}`)}
                aria-label={`${hero.name} — open details`}
              >
                <ThinThumb competition={hero} alt={hero.name} />
              </Link>
              <div className="draws-hero-body">
                <div className="draws-hero-top">
                  <div className="draws-hero-copy">
                    <div className="draws-hero-label-row">
                      <span className="draws-hero-label">Next draw</span>
                      {heroSoldOut ? (
                        <span className="draws-hero-sold-out">Sold out</span>
                      ) : null}
                    </div>
                    <h3 className="draws-hero-title">{hero.name}</h3>
                    <p className="draws-hero-datetime">
                      {formatUpcomingDrawLabel(
                        hero.drawingDate ?? hero.endDate,
                        locale,
                        new Date(nowMs),
                      )}
                    </p>
                  </div>
                  <Link
                    className="draws-hero-chevron"
                    to={withLocale(locale, `competitions/${hero.id}`)}
                    aria-label={`${hero.name} — open details`}
                  >
                    <span aria-hidden>→</span>
                  </Link>
                </div>

                {showHeroCountdown ? (
                  <CountdownTimer
                    targetIso={drawIsoHero}
                    locale={locale}
                    nowMs={nowMs}
                    countdownClassName="draws-hero-countdown"
                  />
                ) : null}

                <DrawAlertHeroStrip competition={hero} locale={locale} nowMs={nowMs} />
              </div>
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
