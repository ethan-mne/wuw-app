import { Card, PageHeader, StatPill } from '../../components/ui';
import { AccountDataError, AccountSignInRequired } from '../../features/account/AccountFetchFallback';
import { MobileLoyaltyProgram } from '../../features/account/MobileLoyaltyProgram';
import { AccountNav } from '../../features/account/AccountNav';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { cacheKeys } from '../../lib/dataCache';
import { mobileDataService } from '../../services/mobileDataService';
import type { AccountSummary } from '../../types';

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

export function AccountDashboardPage() {
  const {
    data: result,
    isLoading,
    refetch,
  } = useCachedQuery(cacheKeys.accountSummary, () => mobileDataService.loadAccountSummary());

  const phase = phaseFromResult(result, isLoading);
  const summary: AccountSummary | undefined =
    result?.kind === 'ok' ? result.data : undefined;

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
      <Card>
        <h3>Hello {summary.userName}</h3>
        <div className="stats-grid">
          <StatPill label="Wincoins" value={summary.points} />
          <StatPill label="Tickets" value={summary.activeTickets} />
        </div>
      </Card>
      <MobileLoyaltyProgram wincoins={summary.points} />
    </section>
  );
}
