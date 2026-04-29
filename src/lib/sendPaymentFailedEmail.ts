'use server';
import { resend } from '@/lib/resend';
import { PaymentFailedEmail } from '@/components/emails/payment-failed-email';
import type { CompetitionInterface } from './interfaces';
import type { order_paymentMethod } from '@prisma/client';

export async function sendPaymentFailedEmail({
  identifier,
  order_id,
  competition,
  reason,
  paymentMethod,
}: {
  identifier: string;
  order_id: string;
  competition: CompetitionInterface;
  reason: string;
  paymentMethod?: order_paymentMethod;
}) {
  try {
    console.log('sending payment failed email');
    const data = await resend.emails.send({
      from: 'noreply@winuwatch.uk',
      to: [identifier],
      subject: `Payment Failed - WINUWATCH ORDER: #${order_id}`,
      react: PaymentFailedEmail({
        orderNumber: order_id,
        competitionName: competition.name,
        competitionImage: competition.Watches?.images_url[0]?.url ?? '',
        reason: reason,
        paymentMethod,
      }),
    });

    return { success: true, data };
  } catch (error) {
    console.log('failed to send payment failed email:', error);
    throw new Error('Failed to send the payment failed email.');
  }
}
