import { resend } from '@/lib/resend';
import { MagicLinkEmail } from '@/components/emails/magicLinkEmail';

export async function sendVerificationRequest({
  identifier,
  url,
}: {
  identifier: string;
  url: string;
  provider?: string;
  theme?: string;
}) {
  const { host } = new URL(url);
  try {
    const data = await resend.emails.send({
      from: 'noreply@winuwatch.uk',
      to: [identifier],
      subject: `Log in to ${host}`,
      text: text({ url, host }),
      react: MagicLinkEmail({ url, host }),
    });
    return { success: true, data };
  } catch (error) {
    console.log('failed');
    throw new Error('Failed to send the verification Email.');
  }
}

function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n${url}\n\n`;
}
