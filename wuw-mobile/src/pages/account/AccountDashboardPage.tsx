import { useEffect, useState } from 'react';
import { Card, PageHeader, StatPill } from '../../components/ui';
import { AccountNav } from '../../features/account/AccountNav';
import { mobileDataService } from '../../services/mobileDataService';
import type { AccountSummary } from '../../types';

export function AccountDashboardPage() {
  const [accountSummary, setAccountSummary] = useState<AccountSummary>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void mobileDataService
      .getAccountSummary()
      .then(setAccountSummary)
      .catch(() => setAccountSummary(undefined))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading account...</p>;
  }
  if (!accountSummary) {
    return <p>Unable to load account data.</p>;
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Account"
        title="Dashboard"
        description="Mobile equivalent of the web account dashboard."
      />
      <AccountNav />
      <Card>
        <h3>Hello {accountSummary.userName}</h3>
        <div className="stats-grid">
          <StatPill label="Coins" value={accountSummary.points} />
          <StatPill label="Tickets" value={accountSummary.activeTickets} />
        </div>
      </Card>
    </section>
  );
}
