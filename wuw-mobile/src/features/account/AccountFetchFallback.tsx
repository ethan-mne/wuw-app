import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { AccountNav } from './AccountNav';

type AccountSignInRequiredProps = {
  pageTitle: string;
  pageDescription?: string;
};

export function AccountSignInRequired({
  pageTitle,
  pageDescription,
}: AccountSignInRequiredProps) {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <section className="page-stack page-content-pad">
      <PageHeader
        eyebrow="Account"
        title={pageTitle}
        description={
          pageDescription ??
          'Sign in with your email so we can load your account from the server.'
        }
      />
      <AccountNav />
      <Card>
        <p>
          You are not signed in, or your session is not available in this app yet. Use the same
          email as on the website after you complete email verification.
        </p>
        <ActionLink to={withLocale(locale, 'login')}>Sign in</ActionLink>
      </Card>
    </section>
  );
}

type AccountDataErrorProps = {
  pageTitle: string;
  onRetry: () => void;
};

export function AccountDataError({ pageTitle, onRetry }: AccountDataErrorProps) {
  return (
    <section className="page-stack page-content-pad">
      <PageHeader
        eyebrow="Account"
        title={pageTitle}
        description="We couldn't load your account data."
      />
      <AccountNav />
      <Card>
        <p>Check your connection and API configuration, then try again.</p>
        <button className="action-link primary" type="button" onClick={onRetry}>
          Try again
        </button>
      </Card>
    </section>
  );
}
