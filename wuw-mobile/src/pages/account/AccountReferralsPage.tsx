import { useCallback, useState } from 'react';

import { Card, PageHeader } from '../../components/ui';
import { AccountDataError, AccountSignInRequired } from '../../features/account/AccountFetchFallback';
import { AccountNav } from '../../features/account/AccountNav';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { cacheKeys } from '../../lib/dataCache';
import { buildReferralShareMessage, openWhatsAppShare } from '../../lib/whatsappShare';
import { mobileDataService } from '../../services/mobileDataService';
import type { AccountSummary, ReferralUsageItem } from '../../types';

type LoadPhase = 'loading' | 'ok' | 'sign_in_required' | 'error';

const DEFAULT_SITE_URL = 'https://winuwatch.com';

function resolveReferralsPhase(
  summaryResult: Awaited<ReturnType<typeof mobileDataService.loadAccountSummary>> | undefined,
  usagesResult: Awaited<ReturnType<typeof mobileDataService.listReferralUsages>> | undefined,
  isLoading: boolean,
): LoadPhase {
  if (!summaryResult || !usagesResult) {
    return isLoading ? 'loading' : 'error';
  }
  if (summaryResult.kind === 'sign_in_required' || usagesResult.kind === 'sign_in_required') {
    return 'sign_in_required';
  }
  if (summaryResult.kind === 'error') {
    return 'error';
  }
  return 'ok';
}

export function AccountReferralsPage() {
  const {
    data: summaryResult,
    isLoading: loadingSummary,
    refetch: refetchSummary,
  } = useCachedQuery(cacheKeys.accountSummary, () => mobileDataService.loadAccountSummary());

  const {
    data: usagesResult,
    isLoading: loadingUsages,
    refetch: refetchUsages,
  } = useCachedQuery(cacheKeys.referralUsages, () => mobileDataService.listReferralUsages());

  const summary: AccountSummary | undefined =
    summaryResult?.kind === 'ok' ? summaryResult.data : undefined;
  const usages: ReferralUsageItem[] =
    usagesResult?.kind === 'ok' ? usagesResult.data : [];
  const phase = resolveReferralsPhase(
    summaryResult,
    usagesResult,
    loadingSummary || loadingUsages,
  );

  const [copyLabel, setCopyLabel] = useState<'Copy code' | 'Copied'>('Copy code');

  const siteUrl = import.meta.env.VITE_SITE_URL ?? DEFAULT_SITE_URL;

  const refetch = useCallback(() => {
    refetchSummary();
    refetchUsages();
  }, [refetchSummary, refetchUsages]);

  const referralCode = summary?.referralCode?.trim() ?? '';
  const canUseCode = Boolean(referralCode);

  const shareOnWhatsApp = useCallback(() => {
    if (!canUseCode) return;
    void openWhatsAppShare(buildReferralShareMessage(referralCode, siteUrl));
  }, [canUseCode, referralCode, siteUrl]);

  const copyCode = useCallback(async () => {
    if (!canUseCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = referralCode;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setCopyLabel('Copied');
    window.setTimeout(() => setCopyLabel('Copy code'), 2000);
  }, [canUseCode, referralCode]);

  if (phase === 'loading') {
    return (
      <div
        className="home-competitions-loading page-content-pad"
        role="status"
        aria-live="polite"
      >
        <span className="home-competitions-loading-spinner" aria-hidden />
        <span className="sr-only">Loading referrals...</span>
      </div>
    );
  }

  if (phase === 'sign_in_required') {
    return <AccountSignInRequired pageTitle="Referrals" />;
  }

  if (phase === 'error' || !summary) {
    return (
      <AccountDataError pageTitle="Referrals" onRetry={refetch} />
    );
  }

  return (
    <section className="page-stack page-content-pad">
      <PageHeader eyebrow="Account" title="Referrals" />
      <AccountNav />
      <Card>
        <p className="status-label">Referral code</p>
        <div className="referral-code-block">
          <div className="referral-code-row">
            <h3>{referralCode || '—'}</h3>
            <button
              type="button"
              className="action-link secondary referral-copy-btn"
              disabled={!canUseCode}
              onClick={() => void copyCode()}
            >
              {copyLabel}
            </button>
          </div>
          <p className="referral-hint">Share your code with friends. They can use it when they sign up.</p>
          <div className="referral-actions">
            <button
              type="button"
              className="action-link referral-whatsapp"
              disabled={!canUseCode}
              onClick={shareOnWhatsApp}
            >
              Share on WhatsApp
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <p className="status-label">Coupon usage</p>
        <p className="referral-usage-title">When your code is used</p>
        <p className="referral-usage-explainer">
          Confirmed orders that used your referral code. Wincoins shown match our current reward (10 per
          ticket purchased with your code).
        </p>
        {usages.length === 0 ? (
          <p className="referral-usage-empty">No uses yet — share your code to start earning Wincoins.</p>
        ) : (
          <ul className="referral-usage-list" role="list">
            {usages.map((row, index) => (
              <li key={`${row.usedAt}-${row.customerName}-${index}`} className="referral-usage-item">
                <p className="referral-usage-customer">{row.customerName}</p>
                <p className="referral-usage-meta">
                  <span className="referral-usage-date">{formatDrawDateDdMmYyyy(row.usedAt)}</span>
                  <span className="referral-usage-sep" aria-hidden>
                    ·
                  </span>
                  <span className="referral-usage-comp">{row.competitionName}</span>
                </p>
                <p className="referral-usage-wincoins">
                  +{row.wincoinsEarned} Wincoins
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
