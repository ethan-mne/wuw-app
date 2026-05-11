import { type SVGProps, useId } from 'react';
import winuLogo from '../../../assets/logo.png';
import { MobileFooter } from '../../components/MobileFooter';
import {
  CONTACT_INFO,
  contactTelHref,
  contactWhatsAppUrl,
} from '../../data/contactInfo';

function SvgInstagram(props: SVGProps<SVGSVGElement>) {
  const gradId = `ig-contact-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} aria-hidden {...props}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f58529" />
          <stop offset="50%" stopColor="#dd2a7b" />
          <stop offset="100%" stopColor="#8134af" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4.5" fill="none" stroke={`url(#${gradId})`} strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="#dd2a7b" />
    </svg>
  );
}

function SvgWhatsApp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden {...props}>
      <path
        fill="#25d366"
        d="M20.52 3.48A11.87 11.87 0 0 0 12.03 0C5.52 0 .23 5.29.23 11.79c0 2.09.54 4.08 1.58 5.82L0 24l6.53-1.71a11.7 11.7 0 0 0 5.5 1.4h.01c6.51 0 11.8-5.28 11.8-11.79 0-3.15-1.22-6.11-3.43-8.41zM12.03 21.47h-.01a9.53 9.53 0 0 1-4.87-1.34l-.35-.2-3.71.97 1-3.61-.23-.37a9.53 9.53 0 0 1-1.45-5.06c0-5.27 4.29-9.56 9.57-9.56 2.56 0 4.96.99 6.76 2.79a9.54 9.54 0 0 1 2.81 6.76c-.01 5.28-4.29 9.56-9.56 9.56zm5.53-7.61c-.3-.15-1.78-.88-2.06-.98-.27-.11-.46-.17-.67.17-.21.34-.81.98-.99 1.18-.18.2-.37.23-.67.07-.3-.15-1.27-.46-2.43-1.49-.89-.79-1.5-1.77-1.67-2.06-.17-.3-.02-.46.13-.61.13-.13.29-.34.43-.52.14-.17.18-.31.27-.52.09-.21.05-.39-.03-.53-.07-.14-.67-1.62-.92-2.21-.24-.58-.49-.51-.67-.51h-.56c-.2 0-.52.08-.8.39-.26.31-1.02 1-1.02 2.43s1.03 2.82 1.17 3.02c.15.21 2.02 3.06 4.93 4.23.69.3 1.23.49 1.65.61.71.21 1.35.17 1.86.07.56-.09 1.78-.73 2.03-1.43.26-.71.26-1.32.17-1.44-.06-.09-.29-.21-.61-.37z"
      />
    </svg>
  );
}

function SvgPhone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M6.62 10.79a15.15 15.15 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V21a1 1 0 0 1-1 1C10.74 22 3 14.26 3 4a1 1 0 0 1 1-1h3.98a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2z"
      />
    </svg>
  );
}

function SvgMail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"
      />
    </svg>
  );
}

function SvgPin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 7a2.5 2.5 0 0 1 0 4.5z"
      />
    </svg>
  );
}

export function ContactUsBody() {
  const address = CONTACT_INFO.addressLines.join(' ');

  return (
    <>
      <section className="contact-us-screen" aria-labelledby="contact-us-title">
        <div className="contact-us-inner">
          <h1 id="contact-us-title" className="contact-us-title">
            Contact Information
          </h1>
          <p className="contact-us-subtitle">
            Reach out to us on Instagram or WhatsApp
          </p>

          <ul className="contact-us-list">
            <li className="contact-us-item">
              <span className="contact-us-icon" aria-hidden>
                <SvgInstagram />
              </span>
              <div className="contact-us-item-body">
                <strong className="contact-us-label">Follow us on Instagram</strong>
                <a
                  className="contact-us-value-link"
                  href={CONTACT_INFO.instagramUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {CONTACT_INFO.instagramHandle}
                </a>
              </div>
            </li>

            <li className="contact-us-item">
              <span className="contact-us-icon contact-us-icon--whatsapp" aria-hidden>
                <SvgWhatsApp />
              </span>
              <div className="contact-us-item-body">
                <strong className="contact-us-label">Contact us on WhatsApp</strong>
                <a
                  className="contact-us-value-link"
                  href={contactWhatsAppUrl()}
                  rel="noreferrer"
                  target="_blank"
                >
                  {CONTACT_INFO.whatsappDisplay}
                </a>
              </div>
            </li>

            <li className="contact-us-item">
              <span className="contact-us-icon contact-us-icon--muted" aria-hidden>
                <SvgPhone />
              </span>
              <div className="contact-us-item-body">
                <strong className="contact-us-label">Phone</strong>
                <a className="contact-us-value-link" href={contactTelHref()}>
                  {CONTACT_INFO.phoneDisplay}
                </a>
              </div>
            </li>

            <li className="contact-us-item">
              <span className="contact-us-icon contact-us-icon--muted" aria-hidden>
                <SvgMail />
              </span>
              <div className="contact-us-item-body">
                <strong className="contact-us-label">Email</strong>
                <a className="contact-us-value-link" href={`mailto:${CONTACT_INFO.email}`}>
                  {CONTACT_INFO.email}
                </a>
              </div>
            </li>

            <li className="contact-us-item">
              <span className="contact-us-icon contact-us-icon--muted" aria-hidden>
                <SvgPin />
              </span>
              <div className="contact-us-item-body">
                <strong className="contact-us-label">Address</strong>
                <address className="contact-us-address">{address}</address>
              </div>
            </li>
          </ul>

          <div className="contact-us-family">
            <img
              className="contact-us-family-logo"
              src={winuLogo}
              alt=""
              width={72}
              height={72}
              decoding="async"
            />
            <p className="contact-us-family-title">Winuwatch Family</p>
          </div>
        </div>
      </section>
      <MobileFooter />
    </>
  );
}
