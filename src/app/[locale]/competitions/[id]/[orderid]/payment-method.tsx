'use client';
import type { Order, order_paymentMethod } from '@prisma/client';
import { api } from '@/trpc/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { WorldCardForm } from '@/lib/worldcard';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import type { RouterOutputs } from '@/trpc/shared';
import { useRouter } from 'next/navigation';

import {
  VisaLogo,
  MastercardLogo,
  AmericanExpressLogo,
  ApplePayLogo,
  GooglePayLogo,
} from '@/components/payment-logos';

const PaymentMethodSelector = ({
  paymentMethod,
  setPaymentMethod,
  width = 60,
  height = 40,
}: {
  paymentMethod: order_paymentMethod;
  setPaymentMethod: (paymentMethod: order_paymentMethod) => void;
  width?: number;
  height?: number;
}) => (
  <RadioGroup
    className='grid gap-4'
    onValueChange={setPaymentMethod}
    value={paymentMethod}
  >
    <label htmlFor='stripe' className='cursor-pointer'>
      <Card className='relative flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent'>
        <RadioGroupItem value='STRIPE' id='stripe' className='border-2' />
        <div className='flex flex-1 items-center justify-between'>
          <div className='text-sm font-semibold'>
            <div className='flex flex-wrap items-center gap-2'>
              <VisaLogo width={width} height={height} />
              <MastercardLogo width={width} height={height} />
              <AmericanExpressLogo width={width} height={height} />
              <GooglePayLogo width={width} height={height} />
              <ApplePayLogo width={width} height={height} />
            </div>
          </div>
        </div>
      </Card>
    </label>
  </RadioGroup>
);

const PaymentWidget = ({
  paymentData,
}: {
  paymentData: RouterOutputs['payments']['createCheckoutSession']['paymentData'];
}) => {
  if (
    typeof paymentData === 'object' &&
    'id' in paymentData &&
    paymentData.id
  ) {
    return <WorldCardForm worldCardId={paymentData.id} />;
  } else {
    console.error('61-Error creating checkout session', paymentData);
    return null;
  }
};
export function PaymentMethod({
  order,
  competitionId,
}: {
  order: Order;
  competitionId: string;
}) {
  const [paymentMethod, setPaymentMethod] = useState<order_paymentMethod>(
    order.paymentMethod,
  );
  const router = useRouter();
  const {
    data: checkoutData,
    isLoading,
    mutate,
    reset,
  } = api.payments.createCheckoutSession.useMutation({
    onError: (error) => {
      toast.error('Error creating checkout session', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
    onSuccess: async ({ paymentData, order }) => {
      console.log('paymentData', paymentData);
      if (typeof paymentData === 'string' && order.paymentMethod === 'STRIPE') {
        router.push(paymentData);
        return;
      }
    },
  });

  const handlePayment = useCallback(() => {
    mutate({
      order_id: order.id,
      paymentMethod,
      order_competition_id: competitionId,
    });
  }, [mutate, order.id, paymentMethod, competitionId]);

  return (
    <div className='space-y-4 gap-4'>
      {checkoutData ? (
        <div className='space-y-4'>
          <PaymentWidget paymentData={checkoutData.paymentData} />
          <Button variant='outline' className='w-full' onClick={reset}>
            Change Payment Method
          </Button>
        </div>
      ) : (
        <PaymentMethodSelector
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
        />
      )}

      {!checkoutData && !isLoading && (
        <Button className='w-full' onClick={handlePayment} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Continue to Payment'}
        </Button>
      )}
    </div>
  );
}
