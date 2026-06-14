import { describe, expect, it } from 'vitest';

import { buildReferralShareMessage, buildWhatsAppShareUrl } from './whatsappShare';

describe('buildReferralShareMessage', () => {
  it('includes the referral code and site url on separate lines', () => {
    const message = buildReferralShareMessage('ABCD1234', 'https://winuwatch.com');

    expect(message).toContain('Join WINUWATCH with my referral code:');
    expect(message).toContain('ABCD1234');
    expect(message).toContain('Use this code when you sign up for 10% off.');
    expect(message).toContain('https://winuwatch.com');
  });
});

describe('buildWhatsAppShareUrl', () => {
  it('uses api.whatsapp.com and encodes the full message', () => {
    const message = buildReferralShareMessage('ABCD1234', 'https://winuwatch.com');
    const url = buildWhatsAppShareUrl(message);

    expect(url.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
    expect(new URL(url).searchParams.get('text')).toBe(message);
  });
});
