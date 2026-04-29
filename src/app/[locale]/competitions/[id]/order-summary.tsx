'use client';

import Image from 'next/image';
import { TicketQuantity } from './ticket-quantity';
import { Checkbox } from '@/components/ui/checkbox';
import type { UseFormReturn } from 'react-hook-form';
import type { checkoutSchema } from './checkout-step';
import Link from 'next/link';
import { Coupon } from './coupon';
import { calculateTotal } from '@/lib/utils';
import type { CompetitionInterface } from '@/lib/interfaces';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from '@/components/ui/form';
import type { ReferalType } from '@/lib/types';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { formatCurrency } from '@/lib/formaters';
import type { Order } from '@prisma/client';

export function OrderSummary({
  form,
  competition,
  setCoupon,
  coupon,
  paymentStep,
  numberOfTickets,
  disabled = false,
}: Readonly<{
  form: UseFormReturn<z.infer<typeof checkoutSchema>>;
  competition: CompetitionInterface;
  setCoupon: React.Dispatch<React.SetStateAction<ReferalType | null>>;
  coupon: ReferalType | null;
  paymentStep: boolean;
  numberOfTickets: number;
  disabled?: boolean;
}>) {
  const Tcheckout = useTranslations('checkout');
  const Tcompetition = useTranslations('competition');

  return (
    <div className='w-full flex flex-col items-center justify-center gap-4'>
      <p className='text-foreground text-[24px] font-bold uppercase tracking-tighter '>
        {Tcheckout('ordersum').toLowerCase()}
      </p>
      {/* watch info */}
      <div className='w-full flex gap-4'>
        <Image
          src={
            competition.Watches?.images_url[0]?.url ?? '/images/placeholder.png'
          }
          alt='plceholder'
          width={0}
          height={0}
          sizes='100vw'
          className='flex-1 w-full h-[141px] object-contain  '
        />
        <div className='flex flex-1 flex-col gap-2 pt-2'>
          <p className='uppercase text-[16px] font-bold text-foreground'>
            {competition.Watches?.brand + ' ' + competition.Watches?.model}
          </p>
          <TicketQuantity remaining_tickets={competition.remaining_tickets} />
        </div>
      </div>
      {/* total */}
      <div className='w-4/5 flex justify-between items-baseline  pb-2 pt-1 border-y-2'>
        <p className='font-medium text-[20px] text-foreground'>
          {Tcheckout('total').toLowerCase()} :
        </p>
        <p className='font-bold text-[25px] text-foreground'>
          {formatCurrency(
            calculateTotal(numberOfTickets, competition.ticket_price, coupon)
              .total,
          )}
        </p>
      </div>
      {/* coupon*/}
      {!paymentStep && (
        <>
          {numberOfTickets < 15 && (
            <div className='w-4/5'>
              <Coupon form={form} coupon={coupon} setCoupon={setCoupon} />
            </div>
          )}
          <div className='flex flex-col gap-4 w-4/5'>
            {/* Age verification notice */}
            <div className='text-[12px] text-[#898989] italic mb-2'>
              {Tcompetition('age_verification_notice')}
            </div>

            <div className='flex items-start space-x-2'>
              <FormField
                control={form.control}
                name='accept_terms'
                render={({ field }) => (
                  <FormItem className='flex items-start space-x-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='w-[14px] h-[14px] border-foreground rounded-md data-[state=checked]:text-foreground data-[state=checked]:bg-white'
                      />
                    </FormControl>
                    <FormLabel
                      htmlFor='accept_terms'
                      className='text-[13px] text-[#898989] font-medium space-y-0 leading-none'
                    >
                      {Tcompetition('confirm_age_18')}{' '}
                      <Link
                        target='_blank'
                        rel='noreferrer'
                        className='underline'
                        href='/terms-and-conditions'
                      >
                        {Tcompetition('terms_and_conditions')}
                      </Link>
                      {', '}
                      {/* <Link
                        target='_blank'
                        rel='noreferrer'
                        className='underline'
                        href='/refund-and-cancellation'
                      >
                        {Tcompetition('refund_policy')}
                      </Link>
                      {', '} */}
                      <Link
                        target='_blank'
                        rel='noreferrer'
                        className='underline'
                        href='/refund-and-cancellation'
                      >
                        {Tcompetition('including_non_refundable')}
                      </Link>
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='subscribe_to_newsletter'
              render={({ field }) => (
                <FormItem className='flex items-start space-x-2'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className='w-[14px] h-[14px] border-foreground rounded-md data-[state=checked]:text-foreground data-[state=checked]:bg-white'
                    />
                  </FormControl>
                  <FormLabel
                    htmlFor='terms'
                    className='text-[13px] text-[#898989] font-medium space-y-0 leading-none'
                  >
                    {Tcompetition('agree_receive_email_updates')}
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function PaymentSummary({
  competition,
  order,
  ticketCount,
  disabled = false,
}: Readonly<{
  competition: CompetitionInterface;
  order: Order;
  ticketCount: number;
  disabled?: boolean;
}>) {
  const Tcheckout = useTranslations('checkout');
  return (
    <div className='w-full flex flex-col items-center justify-center gap-4'>
      {/* watch info */}
      <div className='w-full flex gap-4'>
        <Image
          src={
            competition.Watches?.images_url[0]?.url ?? '/images/placeholder.png'
          }
          alt='plceholder'
          width={0}
          height={0}
          sizes='100vw'
          className='flex-1 w-full h-[141px] object-contain  '
        />
        <div className='flex flex-1 flex-col gap-2 pt-2'>
          <p className='uppercase text-[16px] font-bold text-foreground'>
            {competition.Watches?.brand + ' ' + competition.Watches?.model}
          </p>
          <TicketQuantity remaining_tickets={ticketCount} disabled={disabled} />
        </div>
      </div>
      {/* total */}
      <div className='w-4/5 flex justify-between items-baseline  pb-2 pt-1 '>
        <p className='font-medium text-[20px] text-foreground'>
          {Tcheckout('total').toLowerCase()} :
        </p>
        <p className='font-bold text-[25px] text-foreground'>
          {formatCurrency(order.totalPrice)}
        </p>
      </div>
    </div>
  );
}
