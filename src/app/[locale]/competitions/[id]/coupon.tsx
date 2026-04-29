'use client';

import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { z } from 'zod';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { checkoutSchema } from './checkout-step';
import { toast } from 'sonner';
import { api } from '@/trpc/react';
import { useEffect, useState } from 'react';
import { ReferalType } from '@/lib/types';
import { useTranslations } from 'next-intl';

export function Coupon({
  form,
  setCoupon,
  coupon, // Correcting the function name based on your setup
}: Readonly<{
  form: UseFormReturn<z.infer<typeof checkoutSchema>>;
  setCoupon: React.Dispatch<React.SetStateAction<ReferalType | null>>;
  coupon: ReferalType | null;
}>) {
  const [couponCode, setCouponCode] = useState('');
  const [triggerVerification, setTriggerVerification] = useState(false);

  const {
    data: isCouponValid,
    isRefetching,
    refetch,
    error,
  } = api.Referal.getCouponByCode.useQuery(couponCode, {
    enabled: false, // Prevent the query from auto-running
  });
  useEffect(() => {
    if (triggerVerification) {
      toast.loading('Verifying coupon...');
      // Manually refetch/trigger the query
      refetch()
        .then((newData) => {
          // Reset the trigger to allow for future verifications

          setTriggerVerification(false);
          // Directly use the data returned by the refetch call
          if (newData.data) {
            setCoupon(newData.data);
            toast.success('Coupon is valid!');
          } else {
            toast.error(
              newData.error?.message
                ? newData.error.message
                : 'An error occurred while verifying the coupon.',
            );
            setCoupon(null);
          }
          toast.dismiss();
        })
        .catch((error) => {
          // Handle any errors that occur during the fetch
          toast.error('An error occurred while verifying the coupon.');
        });
    }
  }, [triggerVerification, refetch]);

  const handleVerifyCoupon = () => {
    const currentCoupon = form.getValues('coupon') ?? '';
    if (currentCoupon.length < 8) {
      toast.error('Invalid coupon.');
      return;
    } else {
      setCouponCode(currentCoupon);
      setTriggerVerification(true);
    } // This triggers the useEffect to run
  };
  const Tcheckout = useTranslations('checkout');
  const Taccount = useTranslations('account');

  return (
    <FormField
      control={form.control}
      name='coupon'
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div className='relative w-full'>
              <Input
                {...field}
                className='w-full border-foreground'
                placeholder={Taccount('have_a_coupon')}
                readOnly={!!coupon}
                maxLength={8}
              />
              <Button
                type='button'
                disabled={!!coupon}
                onClick={handleVerifyCoupon}
                className='rounded-tl-none bg-foreground hover:bg-foreground h-full text-white hover:text-white uppercase absolute inset-y-0 right-0'
              >
                {Tcheckout('add').toUpperCase()}
              </Button>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
