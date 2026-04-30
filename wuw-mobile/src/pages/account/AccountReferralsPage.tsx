import { useEffect, useState } from 'react';
import { Card, PageHeader } from '../../components/ui';
import { AccountNav } from '../../features/account/AccountNav';
import { mobileDataService } from '../../services/mobileDataService';
import type { AccountSummary } from '../../types';

export function AccountReferralsPage() {
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
    return <p>Loading referrals...</p>;
  }
  if (!accountSummary) {
    return <p>Unable to load referrals.</p>;
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Account" title="Referrals" />
      <AccountNav />
      <Card>
        <p className="status-label">Referral code</p>
        <h3>{accountSummary.referralCode}</h3>
        <p>Mobile placeholder for the web referral dashboard.</p>
      </Card>
    </section>
  );
}
