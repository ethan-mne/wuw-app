import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { useCachedQuery } from '../hooks/useCachedQuery';
import { cacheKeys } from '../lib/dataCache';
import { defaultLocale, isLocale, withLocale } from '../routes/locales';
import { mobileDataService } from '../services/mobileDataService';

type AdminRouteProps = {
  children: ReactNode;
};

export function AdminRoute({ children }: AdminRouteProps) {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const { data: profileResult, isLoading } = useCachedQuery(
    cacheKeys.mobileProfile,
    () => mobileDataService.loadMobileProfile(),
  );

  if (isLoading && !profileResult) {
    return (
      <div className="home-competitions-loading page-content-pad" role="status" aria-live="polite">
        <span className="home-competitions-loading-spinner" aria-hidden />
        <span className="sr-only">Checking admin access...</span>
      </div>
    );
  }

  if (profileResult?.kind === 'sign_in_required') {
    return <Navigate to={withLocale(locale, 'login')} replace />;
  }

  if (profileResult?.kind !== 'ok' || !profileResult.data.isAdmin) {
    return <Navigate to={withLocale(locale, 'account/profile')} replace />;
  }

  return children;
}
