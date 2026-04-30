import { Navigate, Route, Routes } from 'react-router-dom';

import { MobileShell } from '../components/MobileShell';
import { legalPages, supportPages } from '../data/content';
import { AccountDashboardPage } from '../pages/account/AccountDashboardPage';
import { AccountHistoryPage } from '../pages/account/AccountHistoryPage';
import { AccountProfilePage } from '../pages/account/AccountProfilePage';
import { AccountReferralsPage } from '../pages/account/AccountReferralsPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { VerificationPage } from '../pages/auth/VerificationPage';
import { CheckoutPage } from '../pages/competitions/CheckoutPage';
import { CompetitionDetailPage } from '../pages/competitions/CompetitionDetailPage';
import { CompetitionsPage } from '../pages/competitions/CompetitionsPage';
import { ConfirmationPage } from '../pages/competitions/ConfirmationPage';
import { PaymentErrorPage } from '../pages/competitions/PaymentErrorPage';
import { FeedArticlePage } from '../pages/feed/FeedArticlePage';
import { FeedPage } from '../pages/feed/FeedPage';
import { HomePage } from '../pages/HomePage';
import { LegalPage } from '../pages/legal/LegalPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { SupportPage } from '../pages/support/SupportPage';
import { WinnersPage } from '../pages/winners/WinnersPage';
import { defaultLocale } from '../routes/locales';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${defaultLocale}`} replace />} />
      <Route path="/:locale" element={<MobileShell />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="competitions" element={<CompetitionsPage />} />
        <Route path="competitions/:id" element={<CompetitionDetailPage />} />
        <Route path="competitions/:id/:orderId" element={<CheckoutPage />} />
        <Route
          path="competitions/:id/:orderId/confirmation"
          element={<ConfirmationPage />}
        />
        <Route path="competitions/:id/:orderId/error" element={<PaymentErrorPage />} />
        <Route path="account/dashboard" element={<AccountDashboardPage />} />
        <Route path="account/profile" element={<AccountProfilePage />} />
        <Route path="account/history" element={<AccountHistoryPage />} />
        <Route path="account/referrals" element={<AccountReferralsPage />} />
        <Route path="winners" element={<WinnersPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="feed/:slug" element={<FeedArticlePage />} />
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
