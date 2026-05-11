import { useCallback, useEffect, useMemo, useState } from 'react';

import { Card, PageHeader } from '../../components/ui';
import { AccountDataError, AccountSignInRequired } from '../../features/account/AccountFetchFallback';
import { AccountNav } from '../../features/account/AccountNav';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { mobileDataService } from '../../services/mobileDataService';
import type { AccountSummary, ReferralUsageItem } from '../../types';

type LoadPhase = 'loading' | 'ok' | 'sign_in_required' | 'error';

const DEFAULT_SITE_URL = 'https://winuwatch.uk';

function buildReferralShareMessage(code: string, siteUrl: string) {
  return `Join WINUWATCH with my referral code: ${code}\n${siteUrl}`;
}

export function AccountReferralsPage() {
  const [summary, setSummary] = useState<AccountSummary>();
  const [usages, setUsages] = useState<ReferralUsageItem[]>([]);
  const [phase, setPhase] = useState<LoadPhase>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const [copyLabel, setCopyLabel] = useState<'Copy code' | 'Copied'>('Copy code');

  const siteUrl = import.meta.env.VITE_SITE_URL ?? DEFAULT_SITE_URL;

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setUsages([]);
    void mobileDataService.loadAccountSummary().then(async (result) => {
      if (cancelled) return;
      if (result.kind === 'sign_in_required') {
        setPhase('sign_in_required');
        return;
      }
      if (result.kind === 'error') {
        setPhase('error');
        return;
      }
      setSummary(result.data);
      const usagesResult = await mobileDataService.listReferralUsages();
      if (cancelled) return;
      if (usagesResult.kind === 'sign_in_required') {
        setPhase('sign_in_required');
        return;
      }
      if (usagesResult.kind === 'error') {
        setUsages([]);
      } else {
        setUsages(usagesResult.data);
      }
      setPhase('ok');
    });
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const referralCode = summary?.referralCode?.trim() ?? '';
  const canUseCode = Boolean(referralCode);

  const whatsappHref = useMemo(() => {
    if (!canUseCode) return '';
    const text = buildReferralShareMessage(referralCode, siteUrl);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
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
      <AccountDataError pageTitle="Referrals" onRetry={() => setRetryKey((k) => k + 1)} />
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
            <a
              className="action-link referral-whatsapp"
              href={canUseCode ? whatsappHref : '#'}
              rel="noopener noreferrer"
              target="_blank"
              aria-disabled={!canUseCode}
              onClick={(e) => {
                if (!canUseCode) e.preventDefault();
              }}
            >
              Share on WhatsApp
            </a>
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
