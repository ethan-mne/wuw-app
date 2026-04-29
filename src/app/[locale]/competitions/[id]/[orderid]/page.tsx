import { db } from '@/server/db';
import { notFound } from 'next/navigation';
import { PaymentMethod } from './payment-method';
import { getTranslations } from 'next-intl/server';
import { PaymentSummary } from '../order-summary';
import { api } from '@/trpc/server';

export default async function PaymentPage({
  params,
  searchParams,
}: Readonly<{
  params: { id: string; orderid: string };
  searchParams: { error?: string; intent_id?: string };
}>) {
  const [competitionData, order] = await Promise.all([
    api.NewCompetition.getCompetition.query(params.id),
    await db.order.findUnique({
      where: { id: params.orderid },
      include: { _count: { select: { Ticket: true } } },
    }),
  ]);

  if (!competitionData || !order) return notFound();
  // if (searchParams.error) {
  //     return <RetryOrder order={order} error={searchParams.error} />
  // }
  const Tcheckout = await getTranslations('checkout');
  return (
    <div className='grid grid-cols-1 xl:grid-cols-3 gap-8 w-full'>
      <div className='xl:col-span-2 space-y-6'>
        <div className='w-full'>
          <div className='flex flex-col gap-4'>
            {searchParams.error ? (
              <>
                <h1 className='text-2xl font-bold'>
                  {searchParams.error ?? 'Something went wrong'}
                </h1>
                <p className='text-sm text-gray-500'>
                  Please try again or contact us at{' '}
                  <a href='mailto:contact@winuwatch.com'>
                    contact@winuwatch.com
                  </a>
                </p>
              </>
            ) : (
              <h1>
                <p className='text-foreground text-[24px] font-bold uppercase tracking-tighter '>
                  {Tcheckout('ordersum').toLowerCase()}
                </p>
              </h1>
            )}
            <PaymentMethod order={order} competitionId={params.id} />
          </div>
        </div>
      </div>
      <div className='xl:col-span-1'>
        <PaymentSummary
          competition={competitionData.competition}
          order={order}
          ticketCount={order._count.Ticket}
          disabled
        />
      </div>
    </div>
  );
}
