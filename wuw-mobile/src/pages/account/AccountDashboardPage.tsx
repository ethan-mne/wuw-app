import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { CountdownTimer } from '../../components/CountdownTimer';
import { PageHeader, StatPill } from '../../components/ui';
import { AccountDataError, AccountSignInRequired } from '../../features/account/AccountFetchFallback';
import { MobileLoyaltyProgram } from '../../features/account/MobileLoyaltyProgram';
import { AccountNav } from '../../features/account/AccountNav';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { formatDrawDateTimeDualInline } from '../../lib/drawTime';
import { cacheKeys } from '../../lib/dataCache';
import { clearMobileSession } from '../../lib/mobileSessionToken';
import { resolveMediaUrl } from '../../lib/resolveMediaUrl';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { AccountSummary, ActiveCompetitionEntry, Locale } from '../../types';

type LoadPhase = 'loading' | 'ok' | 'sign_in_required' | 'error';

function phaseFromResult(
  result: Awaited<ReturnType<typeof mobileDataService.loadAccountSummary>> | undefined,
  isLoading: boolean,
): LoadPhase {
  if (!result) {
    return isLoading ? 'loading' : 'error';
  }
  if (result.kind === 'ok') {
    return 'ok';
  }
  return result.kind;
}

function entriesPhaseFromResult(
  result: Awaited<ReturnType<typeof mobileDataService.loadActiveEntries>> | undefined,
  isLoading: boolean,
): LoadPhase {
  if (!result) {
    return isLoading ? 'loading' : 'error';
  }
  if (result.kind === 'ok') {
    return 'ok';
  }
  return result.kind;
}

function UpcomingDrawThumb({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  const src = resolveMediaUrl(imageUrl);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <span className="account-upcoming-draws-next-media-fallback" aria-hidden />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function UpcomingDrawCard({
  entry,
  locale,
  nowMs,
  isNext,
}: {
  entry: ActiveCompetitionEntry;
  locale: Locale;
  nowMs: number;
  isNext: boolean;
}) {
  return (
    <div className="account-upcoming-draws-next">
      <div className="account-upcoming-draws-next-main">
        <Link
          className="account-upcoming-draws-next-media"
          to={withLocale(locale, `competitions/${entry.competitionId}`)}
          aria-label={`${entry.competitionName} — open details`}
        >
          <UpcomingDrawThumb
            imageUrl={entry.competitionImageUrl}
            alt={entry.competitionName}
          />
        </Link>
        <div className="account-upcoming-draws-next-copy">
          {isNext ? <p className="status-label">Next draw</p> : null}
          <Link
            className="account-upcoming-draws-next-title"
            to={withLocale(locale, `competitions/${entry.competitionId}`)}
          >
            {entry.competitionName}
          </Link>
          <p className="account-upcoming-draws-next-meta">
            {formatDrawDateTimeDualInline(entry.drawingDate, locale)} · {entry.ticketCount}{' '}
            ticket{entry.ticketCount === 1 ? '' : 's'}
          </p>
          <CountdownTimer
            targetIso={entry.drawingDate}
            locale={locale}
            nowMs={nowMs}
            countdownClassName="draws-hero-countdown"
          />
        </div>
      </div>
    </div>
  );
}

export function AccountDashboardPage() {
  const params = useParams();
  const navigate = useNavigate();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const [signingOut, setSigningOut] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const {
    data: result,
    isLoading,
    refetch,
  } = useCachedQuery(cacheKeys.accountSummary, () => mobileDataService.loadAccountSummary());
  const {
    data: activeEntriesResult,
    isLoading: activeEntriesLoading,
  } = useCachedQuery(cacheKeys.activeEntries, () => mobileDataService.loadActiveEntries());

  const phase = phaseFromResult(result, isLoading);
  const entriesPhase = entriesPhaseFromResult(activeEntriesResult, activeEntriesLoading);
  const summary: AccountSummary | undefined =
    result?.kind === 'ok' ? result.data : undefined;
  const activeEntries: ActiveCompetitionEntry[] =
    activeEntriesResult?.kind === 'ok' ? activeEntriesResult.data : [];
  const shouldShowUpcomingDrawsSection =
    entriesPhase === 'loading' || activeEntries.length > 0;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const onSignOut = () => {
    setSigningOut(true);
    void clearMobileSession().then(() => {
      navigate(withLocale(locale, 'login'), { replace: true });
    });
  };

  if (phase === 'loading') {
    return (
      <div
        className="home-competitions-loading page-content-pad"
        role="status"
        aria-live="polite"
      >
        <span className="home-competitions-loading-spinner" aria-hidden />
        <span className="sr-only">Loading account...</span>
      </div>
    );
  }

  if (phase === 'sign_in_required') {
    return (
      <AccountSignInRequired
        pageTitle="Dashboard"
        pageDescription="Mobile equivalent of the web account dashboard."
      />
    );
  }

  if (phase === 'error' || !summary) {
    return (
      <AccountDataError pageTitle="Dashboard" onRetry={() => refetch()} />
    );
  }

  return (
    <section className="page-stack page-content-pad">
      <PageHeader
        eyebrow="Account"
        title="Dashboard"
        description="Mobile equivalent of the web account dashboard."
      />
      <AccountNav />
      <section className="card account-dashboard-card account-dashboard-summary-card">
        <h3>Hello {summary.userName}</h3>
        <div className="stats-grid">
          <StatPill label="Wincoins" value={summary.points} />
          <StatPill label="Tickets" value={summary.activeTickets} />
        </div>
        <button
          type="button"
          className="checkout-flow-button checkout-flow-button--ghost account-sign-out"
          disabled={signingOut}
          onClick={onSignOut}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </section>
      {shouldShowUpcomingDrawsSection ? (
        <section className="card account-dashboard-card account-upcoming-draws-card">
          <div className="account-upcoming-draws-header">
            <h3>Upcoming draws</h3>
            <p className="account-upcoming-draws-subtitle">
              Competitions where you already have confirmed tickets.
            </p>
          </div>
          {entriesPhase === 'loading' ? (
            <div className="home-competitions-loading account-upcoming-draws-loading" role="status" aria-live="polite">
              <span className="home-competitions-loading-spinner" aria-hidden />
              <span className="sr-only">Loading upcoming draws…</span>
            </div>
          ) : null}
          {entriesPhase === 'ok' && activeEntries.length > 0 ? (
            <div className="account-upcoming-draws-content">
              {activeEntries.map((entry, index) => (
                <UpcomingDrawCard
                  key={entry.competitionId}
                  entry={entry}
                  locale={locale}
                  nowMs={nowMs}
                  isNext={index === 0}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      <MobileLoyaltyProgram wincoins={summary.points} />
    </section>
  );
}
