import { NavLink, useParams } from 'react-router-dom';

import { defaultLocale, isLocale, withLocale } from '../../routes/locales';

const accountRoutes = [
  ['Dashboard', 'account/dashboard'],
  ['Profile', 'account/profile'],
  ['History', 'account/history'],
  ['Referrals', 'account/referrals'],
] as const;

export function AccountNav() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <nav className="segmented-nav" aria-label="Account navigation">
      {accountRoutes.map(([label, path]) => (
        <NavLink
          key={path}
          className={({ isActive }) => (isActive ? 'segment active' : 'segment')}
          to={withLocale(locale, path)}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
