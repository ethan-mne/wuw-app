import { NavLink, Outlet, useParams } from 'react-router-dom';

import { MobileHomeHeader } from './MobileHomeHeader';
import { coreRoutes } from '../routes/routeConfig';
import { defaultLocale, isLocale, withLocale } from '../routes/locales';
import type { Locale } from '../types';

export function MobileShell() {
  const params = useParams();
  const locale: Locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <div className="mobile-shell">
      <MobileHomeHeader />

      <main className="mobile-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Main mobile navigation">
        {coreRoutes.map((route) => (
          <NavLink
            key={route.path || 'home'}
            className={({ isActive }) =>
              isActive ? 'bottom-nav-link active' : 'bottom-nav-link'
            }
            end={route.path === ''}
            to={withLocale(locale, route.path)}
          >
            {route.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
