import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { MobileShell } from '../components/MobileShell';
import { legalPages, supportPages } from '../data/content';
import { getMobileSessionToken } from '../lib/mobileSessionToken';
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
import { WinnersPage } from '../pages/winners/WinnersPage';
import { defaultLocale } from '../routes/locales';

export default function App() {
  useEffect(() => {
    if (!getMobileSessionToken()) {
      return;
    }
    void mobileDataService.syncPushTokenIfPermitted();
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
