import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { PushNotificationBanner } from './PushNotificationBanner';
import { INFORMATIVE_ONLY_MODE } from '../config/informativeOnlyMode';
import { defaultLocale, isLocale, withLocale } from '../routes/locales';
import {
  getLocaleTailPath,
  resolveShellBackTarget,
  shouldShowShellBack,
} from '../routes/shellNavigation';

export function MobileHomeHeader() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const navigate = useNavigate();
  const location = useLocation();
  const tailPath = getLocaleTailPath(location.pathname, locale);
  const showBack = shouldShowShellBack(tailPath);
  const fallbackPath = resolveShellBackTarget(tailPath);
  const fallbackTo = withLocale(locale, fallbackPath);

  function handleBack(): void {
    const stateIdx = typeof window.history.state?.idx === 'number' ? window.history.state.idx : 0;
    if (stateIdx > 0) {
      navigate(-1);
      return;
    }
    navigate(fallbackTo);
  }

  return (
    <div className="site-header-sticky">
      <PushNotificationBanner />
      <header className="site-header">
      {!INFORMATIVE_ONLY_MODE ? (
        <div className="apple-pay-banner">
          <span className="apple-pay-badge">APPLE PAY</span>
          <span>IS AVAILABLE ON WINUWATCH!</span>
        </div>
      ) : null}

      <div className="site-header-bar">
        <div className="header-actions">
          {showBack ? (
            <button
              type="button"
              className="header-back-btn"
              aria-label="Go back"
              onClick={handleBack}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : null}
        </div>

        <Link className="brand-mark" to={withLocale(locale)} aria-label="Go to homepage">
          WINUWATCH
        </Link>

        <div className="header-actions right" aria-hidden="true" />
      </div>

      </header>
    </div>
  );
}
