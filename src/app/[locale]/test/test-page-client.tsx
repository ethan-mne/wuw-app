'use client';

import { api } from '@/trpc/react';
import { TestPaymentSection } from './test-payment-section';
import { Card } from '@/components/ui/card';

interface TestPageClientProps {
  orderId: string;
  competitionId: string;
}

export function TestPageClient({
  orderId,
  competitionId,
}: TestPageClientProps) {
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    error: orderError,
  } = api.payments.getOrderTestDetails.useQuery(orderId);

  const {
    data: competitionData,
    isLoading: isLoadingCompetition,
    error: competitionError,
  } = api.NewCompetition.getCompetition.useQuery(competitionId);

  if (isLoadingOrder || isLoadingCompetition) {
    return (
      <div className='container mx-auto max-w-2xl px-4 py-8'>
        <h1 className='text-2xl font-bold text-center mb-8'>
          Test Payment Methods
        </h1>
        <div className='bg-white rounded p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>
        </div>
      </div>
    );
  }

  if (
    !!orderError ||
    !!competitionError ||
    !orderData?.order ||
    !competitionData?.competition
  ) {
    return (
      <div className='container mx-auto max-w-2xl px-4 py-8'>
        <h1 className='text-2xl font-bold text-center mb-8'>
          Test Payment Methods
        </h1>
        <div className='bg-white rounded p-6'>
          <p className='text-red-600 text-center'>
            {orderError?.message ??
              competitionError?.message ??
              'Order or Competition not found'}
          </p>
        </div>
      </div>
    );
  }

  const { order } = orderData;
  const { competition } = competitionData;

  return (
    <div className='container mx-auto max-w-2xl px-4 py-8'>
      <h1 className='text-2xl font-bold text-center mb-8'>
        Test Payment Methods
      </h1>

      <Card className='p-6 mb-6'>
        <h2 className='text-lg font-semibold mb-4'>Competition Details</h2>
        <ul className='space-y-2'>
          <li>Name: {competition.name}</li>
          <li>Price: £{competition.ticket_price}</li>
          <li>Status: {competition.status}</li>
          <li>Total Tickets: {competition.total_tickets}</li>
          {competition.end_date && (
            <li>
              End Date: {new Date(competition.end_date).toLocaleDateString()}
            </li>
          )}
        </ul>
      </Card>

      <TestPaymentSection order={order} competitionId={competitionId} />
    </div>
  );
}
