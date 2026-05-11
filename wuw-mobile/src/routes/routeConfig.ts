export const coreRoutes = [
  { label: 'Home', path: '' },
  { label: 'Profile', path: 'account/profile' },
  { label: 'Contact us', path: 'contact-us' },
] as const;

export const sourceRouteMap = [
  ['/{locale}', 'HomePage'],
  ['/{locale}/login', 'LoginPage'],
  ['/{locale}/verification', 'VerificationPage'],
  ['/{locale}/competitions/:id', 'CompetitionDetailPage'],
  ['/{locale}/competitions/:id/question', 'QuestionPage'],
  ['/{locale}/competitions/:id/:orderId', 'CheckoutPage'],
  ['/{locale}/competitions/:id/:orderId/confirmation', 'ConfirmationPage'],
  ['/{locale}/competitions/:id/:orderId/error', 'PaymentErrorPage'],
  ['/{locale}/account/dashboard', 'AccountDashboardPage'],
  ['/{locale}/account/profile', 'AccountProfilePage'],
  ['/{locale}/account/history', 'AccountHistoryPage'],
  ['/{locale}/account/referrals', 'AccountReferralsPage'],
  ['/{locale}/winners', 'WinnersPage'],
] as const;
