import { resend } from '@/lib/resend';
import { NewsLetterCoupon } from '@/components/emails/newsletter-coupon';
import { db } from '@/server/db';

export async function sendNewsLetterReductionCode({
  identifier,
}: {
  identifier: string;
}) {
  try {
    const checkEmail = await db.user.findUnique({
      where: { email: identifier },
    });
    if (!checkEmail) {
      return { success: false, checkEmail };
    }
    const data = await resend.emails.send({
      from: 'noreply@winuwatch.uk',
      to: [identifier],
      subject: `Exclusive 25% Reduction Code - WINUWATCH`,
      react: NewsLetterCoupon('4LvDX4hg'),
    });
    return { success: true, data, checkEmail };
  } catch (error) {
    console.log('failed');
    throw new Error('Internal server error', { cause: error });
  }
}
