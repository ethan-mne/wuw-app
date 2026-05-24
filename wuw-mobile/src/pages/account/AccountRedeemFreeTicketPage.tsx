import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { SafeImage } from '../../components/SafeImage';
import { Card, PageHeader } from '../../components/ui';
import {
  AccountDataError,
  AccountSignInRequired,
} from '../../features/account/AccountFetchFallback';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { cacheKeys, invalidateCachedData } from '../../lib/dataCache';
import { resolveMediaUrl } from '../../lib/resolveMediaUrl';
import { formatGbp } from '../../lib/formatCurrency';
import { filterCheapestRedeemableCompetitions } from '../../lib/freeTicketEligibility';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { RedeemFreeTicketResult } from '../../types';

const MAX_WINCOINS = 100;

export function AccountRedeemFreeTicketPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RedeemFreeTicketResult | null>(null);

  const {
    data: summaryResult,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useCachedQuery(cacheKeys.accountSummary, () => mobileDataService.loadAccountSummary());

  const {
    data: competitions = [],
    isLoading: competitionsLoading,
    refetch: refetchCompetitions,
  } = useCachedQuery(cacheKeys.competitions, () => mobileDataService.listCompetitions());

  const loading = summaryLoading || competitionsLoading;
  const wincoins = summaryResult?.kind === 'ok' ? summaryResult.data.points : 0;
  const canRedeem = wincoins >= MAX_WINCOINS;

  const redeemableCompetitions = useMemo(
    () => filterCheapestRedeemableCompetitions(competitions),
    [competitions],
  );
  const hasActiveCompetitions = useMemo(
    () => competitions.some((c) => c.status === 'ACTIVE' && c.remainingTickets > 0),
    [competitions],
  );

  const onRedeem = (competitionId: string) => {
    setError(null);
    setRedeemingId(competitionId);
    void mobileDataService.redeemFreeTicket(competitionId).then((result) => {
      setRedeemingId(null);
      if (result.kind === 'ok') {
        invalidateCachedData(cacheKeys.accountSummary);
        invalidateCachedData(cacheKeys.orderHistory);
        invalidateCachedData(cacheKeys.competitions);
        invalidateCachedData(cacheKeys.competition(competitionId));
        setSuccess(result.data);
        void refetchSummary();
        void refetchCompetitions();
        return;
      }
      if (result.kind === 'sign_in_required') {
        setError('Sign in to redeem a free ticket.');
        return;
      }
      if (result.kind === 'invalid') {
        setError(result.message);
        return;
      }
      setError('Something went wrong. Try again.');
    });
  };

  if (loading) {
    return (
      <div
        className="home-competitions-loading page-content-pad"
        role="status"
        aria-live="polite"
      >
        <span className="home-competitions-loading-spinner" aria-hidden />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (summaryResult?.kind === 'sign_in_required') {
    return <AccountSignInRequired pageTitle="Redeem free ticket" />;
  }

  if (summaryResult?.kind === 'error' || summaryResult?.kind !== 'ok') {
    return (
      <AccountDataError pageTitle="Redeem free ticket" onRetry={() => refetchSummary()} />
    );
  }

  if (success) {
    return (
      <section className="page-stack page-content-pad">
        <PageHeader eyebrow="Account" title="Free ticket redeemed" />
        <Card>
          <p className="status-label">Success</p>
          <h3>{success.competitionName}</h3>
          <p>
            Your free ticket is confirmed. Order reference:{' '}
            <strong>{success.orderId.slice(0, 8)}</strong>
          </p>
          <p>You now have {success.remainingWincoins} Wincoins.</p>
          <Link className="action-link primary" to={withLocale(locale, 'account/history')}>
            View ticket history
          </Link>
          <Link className="action-link secondary" to={withLocale(locale, 'account/dashboard')}>
            Back to dashboard
          </Link>
        </Card>
      </section>
    );
  }

  return (
    <section className="page-stack page-content-pad">
      <PageHeader
        eyebrow="Account"
        title="Redeem free ticket"
        description="Free tickets apply to our lowest entry-price competitions only. 100 Wincoins = 1 free ticket."
      />

      {!canRedeem ? (
        <Card>
          <p className="status-label">Not enough Wincoins</p>
          <p>
            You have {wincoins} Wincoins. Earn {MAX_WINCOINS} to unlock a free ticket.
          </p>
          <Link className="action-link primary" to={withLocale(locale, 'account/dashboard')}>
            Back to dashboard
          </Link>
        </Card>
      ) : null}

      {canRedeem && error ? (
        <div className="checkout-flow-errors page-content-pad" aria-live="polite">
          <p>{error}</p>
          {error.includes('profile') ? (
            <Link className="action-link secondary" to={withLocale(locale, 'account/profile')}>
              Complete your profile
            </Link>
          ) : null}
        </div>
      ) : null}

      {canRedeem && redeemableCompetitions.length === 0 ? (
        <Card>
          <p className="status-label">No eligible competitions</p>
          <p>
            {hasActiveCompetitions
              ? 'Free tickets can only be used on our cheapest active competitions. None are available right now — check back when a low entry-price comp is live.'
              : 'There are no active competitions with tickets left right now. Check back soon.'}
          </p>
          <Link className="action-link primary" to={withLocale(locale, '')}>
            Browse home
          </Link>
        </Card>
      ) : null}

      {canRedeem
        ? redeemableCompetitions.map((competition) => {
            const title = competition.name.trim();
            const hero = competition.competitionImageUrl?.trim();
            const imageSrc = resolveMediaUrl(
              hero || competition.watch.images[0]?.url || undefined,
            );
            const busy = redeemingId === competition.id;

            return (
              <Card key={competition.id}>
                {imageSrc ? (
                  <div className="account-history-card-media">
                    <SafeImage alt={title} src={imageSrc} />
                  </div>
                ) : null}
                <h3>{title}</h3>
                <p className="account-redeem-meta">
                  {formatGbp(competition.ticketPrice)} per ticket · {competition.remainingTickets}{' '}
                  ticket
                  {competition.remainingTickets === 1 ? '' : 's'} left
                </p>
                <button
                  type="button"
                  className="checkout-flow-button"
                  disabled={Boolean(redeemingId)}
                  onClick={() => onRedeem(competition.id)}
                >
                  {busy ? 'Redeeming…' : 'Redeem free ticket'}
                </button>
              </Card>
            );
          })
        : null}
    </section>
  );
}
