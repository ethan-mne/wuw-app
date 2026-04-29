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
  <div className='space-y-4'>
    <h3 className='text-lg font-semibold'>Select Payment Method</h3>
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
              <span className='mr-2'>Stripe</span>
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

      <label htmlFor='worldcard' className='cursor-pointer'>
        <Card className='relative flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent'>
          <RadioGroupItem
            value='WORLDCARD'
            id='worldcard'
            className='border-2'
          />
          <div className='flex flex-1 items-center justify-between'>
            <div className='text-sm font-semibold'>
              <span className='mr-2'>Worldcard</span>
              <div className='flex flex-wrap items-center gap-2'>
                <VisaLogo width={width} height={height} />
                <MastercardLogo width={width} height={height} />
                <ApplePayLogo width={width} height={height} />
              </div>
            </div>
          </div>
        </Card>
      </label>

      <label htmlFor='aureavia' className='cursor-pointer'>
        <Card className='relative flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent'>
          <RadioGroupItem value='AUREAVIA' id='aureavia' className='border-2' />
          <div className='flex flex-1 items-center justify-between'>
            <div className='text-sm font-semibold'>
              <span className='mr-2'>Aureavia</span>
              <div className='flex flex-wrap items-center gap-2'>
                <VisaLogo width={width} height={height} />
                <MastercardLogo width={width} height={height} />
              </div>
            </div>
          </div>
        </Card>
      </label>

      <label htmlFor='paypal' className='cursor-pointer'>
        <Card className='relative flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent'>
          <RadioGroupItem value='PAYPAL' id='paypal' className='border-2' />
          <div className='flex flex-1 items-center justify-between'>
            <div className='text-sm font-semibold'>
              <span className='mr-2'>PayPal</span>
            </div>
          </div>
        </Card>
      </label>

      <label htmlFor='shopify' className='cursor-pointer'>
        <Card className='relative flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent'>
          <RadioGroupItem value='SHOPIFY' id='shopify' className='border-2' />
          <div className='flex flex-1 items-center justify-between'>
            <div className='text-sm font-semibold'>
              <span className='mr-2'>Shopify</span>
            </div>
          </div>
        </Card>
      </label>
    </RadioGroup>
  </div>
);

const PaymentWidget = ({
  paymentData,
  paymentMethod,
}: {
  paymentData: RouterOutputs['payments']['createCheckoutSession']['paymentData'];
  paymentMethod: order_paymentMethod;
}) => {
  if (
    paymentMethod === 'WORLDCARD' &&
    typeof paymentData === 'object' &&
    'id' in paymentData &&
    paymentData.id
  ) {
    return <WorldCardForm worldCardId={paymentData.id} />;
  } else if (typeof paymentData === 'string') {
    return (
      <div className='space-y-4'>
        <p className='text-sm text-gray-600'>
          Payment link generated for {paymentMethod}
        </p>
        <Button
          onClick={() => window.open(paymentData, '_blank')}
          className='w-full'
        >
          Open {paymentMethod} Payment Link
        </Button>
      </div>
    );
  } else {
    console.error('Error creating checkout session', paymentData);
    return (
      <div className='text-red-500'>
        Error creating payment session. Check console for details.
      </div>
    );
  }
};

const OrderInfoCard = ({
  order,
}: {
  order: Order & { _count: { Ticket: number } };
}) => (
  <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
    <h2 className='text-xl font-semibold mb-4'>Current Order Status</h2>
    <div className='space-y-2'>
      <p>
        <span className='font-medium'>Order ID:</span> {order.id}
      </p>
      <p>
        <span className='font-medium'>Total:</span> £{order.totalPrice}
      </p>
      <p>
        <span className='font-medium'>Status:</span>{' '}
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            order.status === 'INCOMPLETE'
              ? 'bg-yellow-100 text-yellow-800'
              : order.status === 'ATTEMPTED'
                ? 'bg-blue-100 text-blue-800'
                : order.status === 'CONFIRMED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
          }`}
        >
          {order.status}
        </span>
      </p>
      <p>
        <span className='font-medium'>Payment Method:</span>{' '}
        {order.paymentMethod}
      </p>
      <p>
        <span className='font-medium'>Tickets:</span> {order._count.Ticket}
      </p>
      {order.paymentId && (
        <p>
          <span className='font-medium'>Payment ID:</span> {order.paymentId}
        </p>
      )}
      {order.intentId && (
        <p>
          <span className='font-medium'>Intent ID:</span> {order.intentId}
        </p>
      )}
    </div>
  </div>
);

export function TestPaymentSection({
  order: initialOrder,
  competitionId,
}: {
  order: Order & { _count: { Ticket: number } };
  competitionId: string;
}) {
  const [paymentMethod, setPaymentMethod] = useState<order_paymentMethod>(
    initialOrder.paymentMethod,
  );
  const [currentOrder, setCurrentOrder] = useState(initialOrder);

  // Query to get updated order details
  const {
    data: orderDetails,
    refetch: refetchOrderDetails,
    isLoading: isLoadingOrderDetails,
  } = api.payments.getOrderTestDetails.useQuery(initialOrder.id, {
    onSuccess: (data) => {
      if (data.order) {
        setCurrentOrder(data.order);
        setPaymentMethod(data.order.paymentMethod);
      }
    },
  });

  // Use the order from the query if available, otherwise use the current order state
  const order = orderDetails?.order ?? currentOrder;

  const {
    data: checkoutData,
    isLoading: isCreatingPayment,
    mutate: createPayment,
    reset: resetPaymentSession,
    error: paymentError,
  } = api.payments.createCheckoutSession.useMutation({
    onError: (error) => {
      console.error('Payment error:', error);
      toast.error('Error creating checkout session', {
        description: error.message ?? 'Unknown error',
      });
    },
    onSuccess: async ({ paymentData, order: updatedOrder }) => {
      console.log('Payment created successfully:', paymentData);
      toast.success(
        `${updatedOrder.paymentMethod} payment session created successfully`,
      );

      // Update the current order state
      setCurrentOrder(updatedOrder);

      // For Stripe in test environment, open in new tab instead of redirecting
      if (
        typeof paymentData === 'string' &&
        updatedOrder.paymentMethod === 'STRIPE'
      ) {
        window.open(paymentData, '_blank');
        return;
      }
    },
  });

  const resetOrderMutation = api.payments.resetOrderForTesting.useMutation({
    onSuccess: () => {
      toast.success('Order reset successfully');
      resetPaymentSession(); // Reset the checkout session state
      void refetchOrderDetails(); // Refetch the order details
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to reset order');
    },
  });

  const handlePayment = useCallback(() => {
    console.log('Creating payment with:', {
      order_id: order.id,
      paymentMethod,
      order_competition_id: competitionId,
    });

    createPayment({
      order_id: order.id,
      paymentMethod,
      order_competition_id: competitionId,
    });
  }, [createPayment, order.id, paymentMethod, competitionId]);

  const handleResetOrder = useCallback(() => {
    resetOrderMutation.mutate(order.id);
  }, [resetOrderMutation, order.id]);

  const handleNewTest = useCallback(() => {
    resetPaymentSession();
    void refetchOrderDetails();
  }, [resetPaymentSession, refetchOrderDetails]);

  return (
    <div className='space-y-6'>
      <OrderInfoCard order={order} />

      <div className='bg-white rounded-lg shadow-md p-6'>
        <h2 className='text-xl font-semibold mb-6'>Test Payment Gateway</h2>

        <div className='space-y-6'>
          {checkoutData ? (
            <div className='space-y-4'>
              <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                <h3 className='text-lg font-semibold text-green-800 mb-2'>
                  Payment Session Created
                </h3>
                <p className='text-sm text-green-600 mb-2'>
                  Payment method:{' '}
                  <span className='font-semibold'>
                    {checkoutData.order.paymentMethod}
                  </span>
                </p>
                <p className='text-sm text-green-600 mb-4'>
                  Order status:{' '}
                  <span className='font-semibold'>
                    {checkoutData.order.status}
                  </span>
                </p>
              </div>

              <PaymentWidget
                paymentData={checkoutData.paymentData}
                paymentMethod={checkoutData.order.paymentMethod}
              />

              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  className='flex-1'
                  onClick={handleNewTest}
                >
                  Test Another Payment Method
                </Button>
                <Button
                  variant='outline'
                  className='flex-1'
                  onClick={handleResetOrder}
                  disabled={resetOrderMutation.isLoading}
                >
                  {resetOrderMutation.isLoading
                    ? 'Resetting...'
                    : 'Reset Order'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />

              {paymentError && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                  <h3 className='text-lg font-semibold text-red-800 mb-2'>
                    Error
                  </h3>
                  <p className='text-sm text-red-600'>{paymentError.message}</p>
                </div>
              )}

              <div className='flex gap-2'>
                <Button
                  className='flex-1'
                  onClick={handlePayment}
                  disabled={isCreatingPayment || isLoadingOrderDetails}
                  size='lg'
                >
                  {isCreatingPayment ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Creating {paymentMethod} Session...
                    </>
                  ) : (
                    `Test ${paymentMethod} Payment`
                  )}
                </Button>

                <Button
                  variant='outline'
                  onClick={handleResetOrder}
                  disabled={
                    resetOrderMutation.isLoading || isLoadingOrderDetails
                  }
                  size='lg'
                >
                  {resetOrderMutation.isLoading
                    ? 'Resetting...'
                    : 'Reset Order'}
                </Button>
              </div>
            </>
          )}

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h3 className='text-sm font-semibold text-blue-800 mb-2'>
              Test Mode Information
            </h3>
            <ul className='text-xs text-blue-600 space-y-1'>
              <li>
                • This is a test environment - no real payments will be
                processed
              </li>
              <li>
                • All payment gateways automatically use test mode in
                non-production
              </li>
              <li>• Stripe: Use test card numbers (4242 4242 4242 4242)</li>
              <li>• Worldcard: Embedded form for direct testing</li>
              <li>• Aureavia: Redirects to test payment page</li>
              <li>• PayPal: Uses PayPal sandbox environment</li>
              <li>• Shopify: Creates draft orders in test shop</li>
              <li>
                • Use &quot;Reset Order&quot; to test the same order with
                different methods
              </li>
            </ul>
          </div>

          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
            <h3 className='text-sm font-semibold text-gray-800 mb-2'>
              Testing Tips
            </h3>
            <ul className='text-xs text-gray-600 space-y-1'>
              <li>
                • Test each payment method to ensure they all work correctly
              </li>
              <li>
                • Check that order status updates properly for each gateway
              </li>
              <li>• Verify payment IDs and intent IDs are set correctly</li>
              <li>• Test the reset functionality to ensure clean state</li>
              <li>• Monitor console logs for detailed debugging information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
