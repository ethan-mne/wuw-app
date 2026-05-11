import { useEffect, useState } from 'react';

import { Card, PageHeader, StatPill } from '../../components/ui';
import { AccountDataError, AccountSignInRequired } from '../../features/account/AccountFetchFallback';
import { MobileLoyaltyProgram } from '../../features/account/MobileLoyaltyProgram';
import { AccountNav } from '../../features/account/AccountNav';
import { mobileDataService } from '../../services/mobileDataService';
import type { AccountSummary } from '../../types';

type LoadPhase = 'loading' | 'ok' | 'sign_in_required' | 'error';

export function AccountDashboardPage() {
  const [summary, setSummary] = useState<AccountSummary>();
  const [phase, setPhase] = useState<LoadPhase>('loading');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void mobileDataService.loadAccountSummary().then((result) => {
      if (cancelled) return;
      if (result.kind === 'ok') {
        setSummary(result.data);
        setPhase('ok');
        return;
      }
      if (result.kind === 'sign_in_required') {
        setPhase('sign_in_required');
        return;
      }
      setPhase('error');
    });
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

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
      <AccountDataError pageTitle="Dashboard" onRetry={() => setRetryKey((k) => k + 1)} />
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
