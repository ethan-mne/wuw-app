import { redirect } from 'next/navigation';
import { getPaymentStatus } from '@/lib/worldcard/service';
import { db } from '@/server/db';
import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { CongratsStep } from '../../congrats-step';
import { PendingStep } from '../../pending-step';

export default async function ConfirmationPage({
  params,
  searchParams,
}: Readonly<{
  params: { id: string; orderid: string };
  searchParams: {
    id?: string;
    resourcePath?: string;
  };
}>) {
  const step = 4;
  const [order, competitionData] = await Promise.all([
    db.order.findUnique({
      where: {
        id: params.orderid,
      },
    }),
    api.NewCompetition.getCompetition.query(params.id),
  ]);

  if (!competitionData || !order) {
    return notFound();
  }
  console.log(searchParams);
  if (order?.paymentMethod === 'WORLDCARD' && order.intentId) {
    const { data: paymentData, error } = await getPaymentStatus(order.intentId);
    console.log('Payment verification:', paymentData, error);
    // if the payment is not successful, redirect to the checkout page
    if (error ?? paymentData?.isError) {
      redirect(
        `/competitions/${params.id}/${params.orderid}?error=${encodeURIComponent(error?.message ?? paymentData?.result.description)}&intent_id=${order.intentId}`,
      );
    }
  }
  // const paymentStatus = await getPaymentStatus(order.payment_id);
  // if status of order is not confirmed or pending, redirect to error page
  if (
    order.status !== 'CONFIRMED' &&
    order.status !== 'PENDING' &&
    order.status !== 'ATTEMPTED'
  ) {
    return redirect(
      `/competitions/${params.id}/${params.orderid}?error=${encodeURIComponent('Payment failed')}&intent_id=${order.intentId}`,
    );
  }

  return (
    <>
      {order.status === 'CONFIRMED' ? (
        <CongratsStep competition={competitionData.competition} order={order} />
      ) : (
        <PendingStep competition={competitionData.competition} order={order} />
      )}
    </>
  );
}
