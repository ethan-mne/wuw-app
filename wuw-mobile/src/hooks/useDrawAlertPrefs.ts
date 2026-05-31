import { useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';

import { disableDrawReminder, enableDrawReminder } from '../lib/drawReminderSubscribe';
import { getMobileSessionToken } from '../lib/mobileSessionToken';
import { withLocale } from '../routes/locales';
import { mobileDataService } from '../services/mobileDataService';
import type { Competition, Locale, OrderSummary } from '../types';

export type DrawAlertCompetition = Pick<
  Competition,
  'id' | 'name' | 'drawingDate' | 'endDate'
>;

export function useDrawAlertPrefs(
  competition: DrawAlertCompetition | undefined,
  enabled: boolean,
) {
  const id = competition?.id?.trim() ?? '';
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
    if (!competition) {
      return;
    }
    setError('');
    setBusy(true);
    try {
      const drawingDateIso = competition.drawingDate ?? competition.endDate;
      const drawMs = new Date(drawingDateIso).getTime();
      if (!Number.isFinite(drawMs) || drawMs <= Date.now()) {
        setError('This draw has already started or ended.');
        return;
      }

      const result = await enableDrawReminder({
        competitionId: id,
        competitionName: competition.name,
        drawingDateIso,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSubscribed(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message || 'Could not enable alerts. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setError('');
    setBusy(true);
    try {
      await disableDrawReminder(id);
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
