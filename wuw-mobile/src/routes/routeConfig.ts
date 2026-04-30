export const coreRoutes = [
  { label: 'Home', path: '' },
  { label: 'Competitions', path: 'competitions' },
  { label: 'Account', path: 'account/dashboard' },
  { label: 'Feed', path: 'feed' },
] as const;

export const sourceRouteMap = [
  ['/{locale}', 'HomePage'],
  ['/{locale}/login', 'LoginPage'],
  ['/{locale}/verification', 'VerificationPage'],
  ['/{locale}/competitions', 'CompetitionsPage'],
  ['/{locale}/competitions/:id', 'CompetitionDetailPage'],
  ['/{locale}/competitions/:id/:orderId', 'CheckoutPage'],
  ['/{locale}/competitions/:id/:orderId/confirmation', 'ConfirmationPage'],
  ['/{locale}/competitions/:id/:orderId/error', 'PaymentErrorPage'],
  ['/{locale}/account/dashboard', 'AccountDashboardPage'],
  ['/{locale}/account/profile', 'AccountProfilePage'],
  ['/{locale}/account/history', 'AccountHistoryPage'],
  ['/{locale}/account/referrals', 'AccountReferralsPage'],
  ['/{locale}/winners', 'WinnersPage'],
  ['/{locale}/feed', 'FeedPage'],
  ['/{locale}/feed/:slug', 'FeedArticlePage'],
] as const;
