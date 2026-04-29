import { db } from '@/server/db';
import { notFound } from 'next/navigation';
import { PaymentMethod } from '../payment-method';

// http://localhost:3000/en/competitions/cm0nkw06o0003exdvjpqh9w03/error?error=order+id&order_id=3a805fa2-a5ba-40f1-8c8f-a2f98e2a011e&intent_id=72902BDA9C00ADED4F1F89231491F2A8.uat01-vm-tx01
export default async function ErrorPage({
  params,
  searchParams,
}: Readonly<{
  params: { id: string; orderid: string };
  searchParams: { error?: string; intent_id?: string };
}>) {
  const order = await db.order.findUnique({
    where: {
      id: params.orderid,
    },
  });
  if (!order) {
    return notFound();
  }

  return (
    <div className='flex flex-col gap-4'>
      <h1 className='text-2xl font-bold'>
        {searchParams.error ?? 'Something went wrong'}
      </h1>
      <p className='text-sm text-gray-500'>
        Please try again or contact us at{' '}
        <a href='mailto:contact@winuwatch.com'>contact@winuwatch.com</a>
      </p>
      <PaymentMethod order={order} competitionId={params.id} />
    </div>
  );
}
