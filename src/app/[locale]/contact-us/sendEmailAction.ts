'use server';

import type { TclientInfo } from '@/components/emails/contactUs';

export default async function sendEmailAction(_clientInfo: TclientInfo) {
  try {
    // Contact form temporarily disabled - users should contact via Instagram or WhatsApp
    // await resend.emails.send({
    //   from: 'noreply@winuwatch.uk',
    //   to: 'contact@winuwatch.com',
    //   subject: 'Client needs help',
    //   react: ContactUsFormClient(clientInfo),
    // });
    throw new Error(
      'Contact form temporarily disabled - please use Instagram or WhatsApp',
    );
  } catch {
    throw new Error(
      'Contact form temporarily disabled - please use Instagram or WhatsApp',
    );
  }
}
