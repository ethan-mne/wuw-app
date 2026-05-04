import { Link, useParams } from 'react-router-dom';

import { defaultLocale, isLocale, withLocale } from '../routes/locales';

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
  ['Refund policy', 'refund-and-cancellation'],
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
        <a href="https://wa.me/447488863429" rel="noreferrer" target="_blank">
          <strong>Need assistance?</strong>
          <span>WhatsApp support</span>
        </a>
        <a href="https://www.instagram.com/winuwatch/" rel="noreferrer" target="_blank">
          <strong>Instagram</strong>
          <span>@winuwatch</span>
        </a>
        <a href="tel:+447488863429">
          <strong>Phone</strong>
          <span>+44 748 886 3429</span>
        </a>
        <a className="footer-email" href="mailto:contact@winuwatch.uk">
          <strong>Email</strong>
          <span>contact@winuwatch.uk</span>
        </a>
      </section>

      <nav className="footer-legal-nav" aria-label="Legal navigation">
        {legalNav.map(([label, path]) => (
          <Link key={path} to={withLocale(locale, path)}>
            {label}
          </Link>
        ))}
      </nav>

      <p className="footer-company">
        WINUWATCH {new Date().getFullYear()} · Lisam Watch Ltd, 63-66 Hatton
        Gardens, Fifth Floor, Suite 23, London, England, EC1N 8LE
      </p>
    </footer>
  );
}
