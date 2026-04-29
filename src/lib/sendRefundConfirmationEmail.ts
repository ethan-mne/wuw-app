'use server';
import { resend } from '@/lib/resend';
import { RefundConfirmationEmail } from '@/components/emails/refund-confirmation-email';
import type { CompetitionInterface } from './interfaces';
import type { order_paymentMethod } from '@prisma/client';

export async function sendRefundConfirmationEmail({
  identifier,
  order_id,
  competition,
  amount,
  currency,
  paymentMethod,
}: {
  identifier: string;
  order_id: string;
  competition: CompetitionInterface;
  amount: string;
  currency: string;
  paymentMethod?: order_paymentMethod;
}) {
  try {
    console.log('sending refund confirmation email');
    const data = await resend.emails.send({
      from: 'noreply@winuwatch.uk',
      to: [identifier],
      subject: `Refund Confirmation - WINUWATCH ORDER: #${order_id}`,
      react: RefundConfirmationEmail({
        orderNumber: order_id,
        competitionName: competition.name,
        competitionImage: competition.Watches?.images_url[0]?.url ?? '',
        amount,
        currency,
        paymentMethod,
      }),
    });

    return { success: true, data };
  } catch (error) {
    console.log('failed to send refund confirmation email:', error);
    throw new Error('Failed to send the refund confirmation email.');
  }
}
