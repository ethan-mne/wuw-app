import { Resend } from 'resend';

import { env } from '@/env';

let resendClient: Resend | undefined;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/** Lazy client so Next.js build can import email modules without RESEND_API_KEY at build time. */
export const resend = {
  get emails() {
    return getResendClient().emails;
  },
};
