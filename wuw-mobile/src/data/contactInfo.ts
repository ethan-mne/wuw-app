/** Public contact details — keep in sync across Contact us and footer. */

export const CONTACT_INFO = {
  instagramUrl: 'https://www.instagram.com/winuwatch/',
  instagramHandle: '@winuwatch',
  whatsappE164Digits: '4474888883429',
  whatsappDisplay: '+44 748 888 3429',
  phoneDisplay: '+44 748 888 3429',
  email: 'contact@winuwatch.uk',
  addressLines: ['50 Princes street, Ipswich, Suffolk, IP1 1RJ, UK'] as const,
} as const;

export function contactWhatsAppUrl(): string {
  return `https://wa.me/${CONTACT_INFO.whatsappE164Digits}`;
}

export function contactTelHref(): string {
  return `tel:+${CONTACT_INFO.whatsappE164Digits}`;
}
