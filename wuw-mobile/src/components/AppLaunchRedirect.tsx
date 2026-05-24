import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
  const locale = resolveLocale(params.locale);
  const didBootstrap = useRef(false);

  useEffect(() => {
    if (didBootstrap.current) {
      return;
    }
    didBootstrap.current = true;

    const homePath = withLocale(locale, '');
    const loginPath = withLocale(locale, 'login');

    if (getMobileSessionToken()) {
      navigate(homePath, { replace: true });
      return;
    }
    navigate(loginPath, { replace: true });
  }, [locale, navigate]);

  return null;
}
