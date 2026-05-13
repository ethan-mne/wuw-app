import { Link, useParams } from 'react-router-dom';

import { INFORMATIVE_ONLY_MODE } from '../config/informativeOnlyMode';
import { defaultLocale, isLocale, withLocale } from '../routes/locales';

export function MobileHomeHeader() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <header className="site-header">
      {!INFORMATIVE_ONLY_MODE ? (
        <div className="apple-pay-banner">
          <span className="apple-pay-badge">APPLE PAY</span>
          <span>IS AVAILABLE ON WINUWATCH!</span>
        </div>
      ) : null}

      <div className="site-header-bar">
        <div className="header-actions" aria-hidden="true" />

        <Link className="brand-mark" to={withLocale(locale)} aria-label="Go to homepage">
          WINUWATCH
        </Link>

        <div className="header-actions right" aria-hidden="true" />
      </div>

    </header>
  );
}
