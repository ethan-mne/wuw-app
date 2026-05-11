import { Link, useParams } from 'react-router-dom';

import { CONTACT_INFO, contactTelHref, contactWhatsAppUrl } from '../data/contactInfo';
import { defaultLocale, isLocale, withLocale } from '../routes/locales';
import type { Locale } from '../types';

/** Policy pages on the public site (e.g. https://winuwatch.com/en/terms-and-conditions). */
const LEGAL_SITE_ORIGIN = 'https://winuwatch.com';

function legalPolicyUrl(locale: Locale, slug: string): string {
  return `${LEGAL_SITE_ORIGIN}/${locale}/${slug}`;
}

const footerNav = [
  ['How to play', 'howtoplay'],
  ['Winners', 'winners'],
  ['FAQ', 'faq'],
  ['About', 'about-us'],
] as const;

const legalNav = [
  ['Acceptable use policy', 'acceptable-use-policy'],
  ['Terms and conditions', 'terms-and-conditions'],
  ['Return policy', 'return-policy'],
  ['Privacy policy', 'privacy-policy'],
  ['Refund & cancellation', 'refund-and-cancellation'],
] as const;

export function MobileFooter() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <footer className="mobile-footer">
      <section className="feedback-banner">
        <p>Share your experience on Trustpilot</p>
        <a href="https://fr.trustpilot.com/review/winuwatch.uk" rel="noreferrer" target="_blank">
          Give feedback now
        </a>
      </section>

      <section className="footer-brand-block">
        <Link className="footer-logo" to={withLocale(locale)}>
          WINUWATCH
        </Link>
        <p className="footer-tagline"># LUXURY WATCH CONTEST</p>
      </section>

      <nav className="footer-main-nav" aria-label="Footer navigation">
        {footerNav.map(([label, path]) => (
          <Link key={path} to={withLocale(locale, path)}>
            {label}
          </Link>
        ))}
      </nav>

      <section className="footer-contact-grid" aria-label="Contact and payment">
        <div>
          <strong>Secure payment</strong>
          <span>Visa · Mastercard · Amex · Apple Pay</span>
        </div>
        <a href={contactWhatsAppUrl()} rel="noreferrer" target="_blank">
          <strong>Need assistance?</strong>
          <span>WhatsApp support</span>
        </a>
        <a href={CONTACT_INFO.instagramUrl} rel="noreferrer" target="_blank">
          <strong>Instagram</strong>
          <span>{CONTACT_INFO.instagramHandle}</span>
        </a>
        <a href={contactTelHref()}>
          <strong>Phone</strong>
          <span>{CONTACT_INFO.phoneDisplay}</span>
        </a>
        <a className="footer-email" href={`mailto:${CONTACT_INFO.email}`}>
          <strong>Email</strong>
          <span>{CONTACT_INFO.email}</span>
        </a>
      </section>

      <nav className="footer-legal-nav" aria-label="Legal navigation">
        {legalNav.map(([label, slug]) => (
          <a
            key={slug}
            href={legalPolicyUrl(locale, slug)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {label}
          </a>
        ))}
      </nav>

      <p className="footer-company">
        WINUWATCH {new Date().getFullYear()} · Lisam Watch Ltd, 63-66 Hatton
        Gardens, Fifth Floor, Suite 23, London, England, EC1N 8LE
      </p>
    </footer>
  );
}
