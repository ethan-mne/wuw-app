import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { getMobileSessionToken } from '../lib/mobileSessionToken';
import { resolveLocale } from '../routes/authPaths';
import { withLocale } from '../routes/locales';

/**
 * Runs once when the shell mounts (app cold start).
 * Guests land on sign-in; signed-in users land on home. After that, routing is unrestricted.
 */
export function AppLaunchRedirect() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const locale = resolveLocale(params.locale);
  const didBootstrap = useRef(false);

  useEffect(() => {
    if (didBootstrap.current) {
      return;
    }
    didBootstrap.current = true;

    const homePath = withLocale(locale, '');
    const loginPath = withLocale(locale, 'login');
    const currentPath = location.pathname.replace(/\/+$/, '') || '/';
    const localeRootPath = `/${locale}`;

    // Only bootstrap-redirect when entering the locale root page.
    if (currentPath !== localeRootPath) {
      return;
    }

    if (getMobileSessionToken()) {
      navigate(homePath, { replace: true });
      return;
    }
    navigate(loginPath, { replace: true });
  }, [locale, location.pathname, navigate]);

  return null;
}
