import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';

import { MobileHomeHeader } from './MobileHomeHeader';
import { coreRoutes } from '../routes/routeConfig';
import { defaultLocale, isLocale, withLocale } from '../routes/locales';
import type { Locale } from '../types';

/** Profile tab stays highlighted on any account screen and on login / OTP verification. */
function isProfileBucketActive(pathname: string, locale: Locale): boolean {
  const prefix = `/${locale}/`;
  if (!pathname.startsWith(prefix)) {
    return false;
  }
  const tail = pathname.slice(prefix.length).replace(/\/$/, '');
  return (
    tail.startsWith('account/') || tail === 'login' || tail === 'verification'
  );
}

export function MobileShell() {
  const params = useParams();
  const location = useLocation();
  const locale: Locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <div className="mobile-shell">
      <MobileHomeHeader />

      <main className="mobile-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Main mobile navigation">
        {coreRoutes.map((route) => {
          const to = withLocale(locale, route.path);
          if (route.path === 'account/profile') {
            const profileActive = isProfileBucketActive(location.pathname, locale);
            return (
              <Link
                key={route.path}
                to={to}
                className={profileActive ? 'bottom-nav-link active' : 'bottom-nav-link'}
                aria-current={profileActive ? 'page' : undefined}
              >
                {route.label}
              </Link>
            );
          }
          return (
            <NavLink
              key={route.path || 'home'}
              className={({ isActive }) =>
                isActive ? 'bottom-nav-link active' : 'bottom-nav-link'
              }
              end={route.path === ''}
              to={to}
            >
              {route.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
