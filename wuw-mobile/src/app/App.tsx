import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { Navigate, Route, Routes } from 'react-router-dom';

import { MobileShell } from '../components/MobileShell';
import { legalPages, supportPages } from '../data/content';
import { getMobileSessionToken } from '../lib/mobileSessionToken';
import { reconcileDrawReminders } from '../lib/drawReminderSubscribe';
import { setupPushNotificationHandlers } from '../lib/pushNotificationSetup';
import { mobileDataService } from '../services/mobileDataService';
import { AccountDashboardPage } from '../pages/account/AccountDashboardPage';
import { AccountHistoryPage } from '../pages/account/AccountHistoryPage';
import { AccountProfilePage } from '../pages/account/AccountProfilePage';
import { AccountRedeemFreeTicketPage } from '../pages/account/AccountRedeemFreeTicketPage';
import { AccountReferralsPage } from '../pages/account/AccountReferralsPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { VerificationPage } from '../pages/auth/VerificationPage';
import { CheckoutPage } from '../pages/competitions/CheckoutPage';
import { CompetitionDetailPage } from '../pages/competitions/CompetitionDetailPage';
import { ConfirmationPage } from '../pages/competitions/ConfirmationPage';
import { PaymentErrorPage } from '../pages/competitions/PaymentErrorPage';
import { QuestionPage } from '../pages/competitions/QuestionPage';
import { DrawsPage } from '../pages/DrawsPage';
import { HomePage } from '../pages/HomePage';
import { LegalPage } from '../pages/legal/LegalPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { SupportPage } from '../pages/support/SupportPage';
import { PushDebugPage } from '../pages/debug/PushDebugPage';
import { WinnersPage } from '../pages/winners/WinnersPage';
import { defaultLocale } from '../routes/locales';

const DRAW_SCHEDULE_UPDATED_EVENT = 'wuw-draw-schedule-updated';

export default function App() {
  useEffect(() => {
    void setupPushNotificationHandlers();
  }, []);

  useEffect(() => {
    const syncPushWhenLoggedIn = () => {
      if (!getMobileSessionToken()) {
        return;
      }
      void mobileDataService.syncPushTokenIfPermitted();
    };

    syncPushWhenLoggedIn();
    window.addEventListener('wuw-mobile-session', syncPushWhenLoggedIn);
    return () => window.removeEventListener('wuw-mobile-session', syncPushWhenLoggedIn);
  }, []);

  useEffect(() => {
    let disposed = false;
    let appStateListener: PluginListenerHandle | null = null;

    const reconcileWhenLoggedIn = async (source: 'startup' | 'session' | 'app_active') => {
      if (!getMobileSessionToken()) {
        return;
      }
      const result = await reconcileDrawReminders().catch(() => null);
      if (!result || source !== 'app_active' || result.updated <= 0) {
        return;
      }
      window.dispatchEvent(
        new CustomEvent(DRAW_SCHEDULE_UPDATED_EVENT, {
          detail: {
            updated: result.updated,
            names: result.updatedCompetitionNames,
          },
        }),
      );
    };

    void reconcileWhenLoggedIn('startup');
    const onSession = () => {
      void reconcileWhenLoggedIn('session');
    };
    window.addEventListener('wuw-mobile-session', onSession);

    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void reconcileWhenLoggedIn('app_active');
      }
    })
      .then((listener) => {
        if (disposed) {
          void listener.remove();
          return;
        }
        appStateListener = listener;
      })
      .catch(() => {
        // Ignore web or unsupported environments.
      });

    return () => {
      disposed = true;
      window.removeEventListener('wuw-mobile-session', onSession);
      if (appStateListener) {
        void appStateListener.remove();
      }
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${defaultLocale}`} replace />} />
      <Route path="/:locale" element={<MobileShell />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route index element={<HomePage />} />
        <Route path="draws" element={<DrawsPage />} />
        <Route path="competitions" element={<Navigate to=".." replace />} />
        <Route path="competitions/:id" element={<CompetitionDetailPage />} />
        <Route path="competitions/:id/question" element={<QuestionPage />} />
        <Route path="competitions/:id/:orderId" element={<CheckoutPage />} />
        <Route
          path="competitions/:id/:orderId/confirmation"
          element={<ConfirmationPage />}
        />
        <Route path="competitions/:id/:orderId/error" element={<PaymentErrorPage />} />
        <Route path="account/dashboard" element={<AccountDashboardPage />} />
        <Route path="account/redeem-free-ticket" element={<AccountRedeemFreeTicketPage />} />
        <Route path="account/profile" element={<AccountProfilePage />} />
        <Route path="account/history" element={<AccountHistoryPage />} />
        <Route path="account/referrals" element={<AccountReferralsPage />} />
        <Route path="winners" element={<WinnersPage />} />
        <Route path="debug/push" element={<PushDebugPage />} />
        {supportPages.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<SupportPage pageKey={page.path} />}
          />
        ))}
        {legalPages.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<LegalPage pageKey={page.path} />}
          />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${defaultLocale}`} replace />} />
    </Routes>
  );
}
