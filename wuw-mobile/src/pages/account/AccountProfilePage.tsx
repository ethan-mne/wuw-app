import { useEffect, useState } from 'react';
import { Card, PageHeader } from '../../components/ui';
import { AccountNav } from '../../features/account/AccountNav';
import { mobileDataService } from '../../services/mobileDataService';
import type { AccountSummary } from '../../types';

export function AccountProfilePage() {
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
    return <p>Loading profile...</p>;
  }
  if (!accountSummary) {
    return <p>Unable to load profile.</p>;
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Account" title="Profile" />
      <AccountNav />
      <Card>
        <p className="status-label">Name</p>
        <h3>{accountSummary.userName}</h3>
        <p>{accountSummary.email}</p>
      </Card>
    </section>
  );
}
