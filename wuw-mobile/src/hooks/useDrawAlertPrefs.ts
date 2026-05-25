import { useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';

import { pushRegisterFailureMessage } from '../lib/pushNotifications';
import { getMobileSessionToken } from '../lib/mobileSessionToken';
import { withLocale } from '../routes/locales';
import { mobileDataService } from '../services/mobileDataService';
import type { Locale, OrderSummary } from '../types';

export function useDrawAlertPrefs(competitionId: string | undefined, enabled: boolean) {
  const id = competitionId?.trim() ?? '';
  const active = enabled && id.length > 0;

  const [hasTicket, setHasTicket] = useState<boolean | null>(null);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!active) {
      return;
    }

    const token = getMobileSessionToken();
    if (!token) {
      setHasTicket(false);
      setSubscribed(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const sub = await mobileDataService.getDrawAlertSubscribed(id).catch(() => false);
      if (!cancelled) {
        setSubscribed(sub);
      }
    })();

    void (async () => {
      const orders = await mobileDataService
        .listOrderHistory()
        .catch(() => [] as OrderSummary[]);
      if (!cancelled) {
        setHasTicket(orders.some((o) => o.competitionId === id));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, active]);

  const alertPrefsLoading =
    Boolean(getMobileSessionToken()) && active && subscribed === null;

  const navigateToLogin = (navigate: NavigateFunction, locale: Locale) => {
    navigate(withLocale(locale, 'login'), { state: { pendingDrawAlertCompetitionId: id } });
  };

  const subscribe = async () => {
    setError('');
    setBusy(true);
    try {
      await mobileDataService.subscribeDrawAlert(id);
      setSubscribed(true);

      const push = await mobileDataService.ensurePushRegisteredForAlerts();
      if (!push.ok) {
        setError(pushRegisterFailureMessage(push));
        console.warn('[wuw-push] registration failed', push.reason, push.detail ?? '');
      } else {
        console.info('[wuw-push] registered', push.tokenPrefix);
      }
    } catch {
      setError('Could not enable alerts. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setError('');
    setBusy(true);
    try {
      await mobileDataService.unsubscribeDrawAlert(id);
      setSubscribed(false);
    } catch {
      setError('Could not turn off alerts. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return {
    hasTicket: hasTicket === true,
    subscribed: subscribed === true,
    busy,
    error,
    setError,
    alertPrefsLoading,
    subscribe,
    unsubscribe,
    navigateToLogin,
  };
}
