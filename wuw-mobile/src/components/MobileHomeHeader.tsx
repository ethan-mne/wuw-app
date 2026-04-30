import { useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';

import { defaultLocale, isLocale, locales, withLocale } from '../routes/locales';
import type { Locale } from '../types';

const menuLinks = [
  ['Winners', 'winners'],
  ['How to play', 'howtoplay'],
  ['Feed', 'feed'],
  ['FAQ', 'faq'],
  ['About', 'about-us'],
  ['Contact us', 'contact-us'],
] as const;

export function MobileHomeHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const locale: Locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <header className="site-header">
      <div className="apple-pay-banner">
        <span className="apple-pay-badge">Apple Pay</span>
        <span>is available on winuwatch!</span>
      </div>

      <div className="site-header-bar">
        <div className="header-actions" aria-label="Mobile quick actions">
          <Link className="icon-link" to={withLocale(locale, 'competitions')} aria-label="Open cart">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9h12l-1.1 10H7.1L6 9Z" />
              <path d="M9 9V7a3 3 0 0 1 6 0v2" />
            </svg>
          </Link>
          <Link
            className="icon-link"
            to={withLocale(locale, 'account/profile')}
            aria-label="Open profile"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 19a7 7 0 0 1 14 0" />
            </svg>
          </Link>
        </div>

        <Link className="brand-mark" to={withLocale(locale)} aria-label="Go to homepage">
          WINUWATCH
        </Link>

        <div className="header-actions right">
          <button
            className="icon-link"
            type="button"
            aria-label="Switch locale"
            onClick={() => {
              const currentIndex = locales.indexOf(locale);
              const nextLocale = locales[(currentIndex + 1) % locales.length] as Locale;
              navigate(withLocale(nextLocale));
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />
            </svg>
          </button>
          <button
            className="menu-button icon-link"
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="mobile-menu-panel" aria-label="Mobile menu">
          {menuLinks.map(([label, path]) => (
            <NavLink
              key={path}
              to={withLocale(locale, path)}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          <a href="https://wa.me/447488863429" rel="noreferrer" target="_blank">
            We are available on WhatsApp
          </a>
        </nav>
      ) : null}
    </header>
  );
}
