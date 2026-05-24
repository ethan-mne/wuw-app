import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

import { getMobileSessionToken } from '../lib/mobileSessionToken';
import { isPublicAuthPath, resolveLocale, shouldRequireLogin } from '../routes/authPaths';
import { withLocale } from '../routes/locales';

export function RequireAuth() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = resolveLocale(params.locale);
  const sessionToken = getMobileSessionToken();
  const loginPath = withLocale(locale, 'login');

  useEffect(() => {
    const redirectIfNeeded = () => {
      if (sessionToken || !shouldRequireLogin(location.pathname, locale)) {
        return;
      }
      navigate(loginPath, { replace: true });
    };

    redirectIfNeeded();

    const onVisible = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      if (getMobileSessionToken()) {
        return;
      }
      const pathname = window.location.pathname;
      if (isPublicAuthPath(pathname, locale)) {
        return;
      }
      navigate(loginPath, { replace: true });
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [locale, location.pathname, loginPath, navigate, sessionToken]);

  if (!sessionToken && shouldRequireLogin(location.pathname, locale)) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
