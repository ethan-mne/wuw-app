import { openExternalUrl } from './openExternalUrl';

const WHATSAPP_SEND_URL = 'https://api.whatsapp.com/send';

export function buildReferralShareMessage(code: string, siteUrl: string): string {
  return [
    'Join WINUWATCH with my referral code:',
    code,
    '',
    'Use this code when you sign up for 10% off.',
    siteUrl,
  ].join('\n');
}

export function buildWhatsAppShareUrl(text: string): string {
  const params = new URLSearchParams({ text });
  return `${WHATSAPP_SEND_URL}?${params.toString()}`;
}

export async function openWhatsAppShare(text: string): Promise<void> {
  openExternalUrl(buildWhatsAppShareUrl(text));
}
