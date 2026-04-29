'use client';

import { SwipeAnimatedButton } from '@/components/animated-button';
import { PhoneInput } from '@/components/phone-input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFieldIcon } from '@/hooks/use-field-icon';
import type { CompetitionInterface } from '@/lib/interfaces';
import type { ReferalType, profileType } from '@/lib/types';
import { calculateTotal } from '@/lib/utils';
import { useCart } from '@/store/use-cart';
import { useCheckoutSteps } from '@/store/use-checkout-steps';
import { api } from '@/trpc/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { subYears } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { type Country, isValidPhoneNumber } from 'react-phone-number-input';
import { toast } from 'sonner';
import { z } from 'zod';
import { GiftTicket } from './git-ticket';
import { OrderSummary } from './order-summary';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter as useNextRouter } from 'next/navigation';
import { posthog } from '@/lib/posthog';
import { countriesWithCodes } from '@/lib/countryList';

export const checkoutSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  country: z.string().min(1),
  zip: z.string().min(4),
  address: z.string().min(4),
  city: z.string().min(4),
  phone: z
    .string()
    .min(4)
    .refine((input) => isValidPhoneNumber(input), {
      message: 'Invalid phone number',
    }),
  email: z.string().email(),
  subscribe_to_newsletter: z.boolean().optional(),
  accept_terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions.',
  }),
  date: z.date().default(new Date()),
  isGift: z.boolean().default(false),
  coupon: z.string().max(8).optional(),
  utm: z.string().optional(),
  challenge_answer: z.boolean().default(false),
});

export type CheckoutType = z.infer<typeof checkoutSchema>;

export function CheckoutStep({
  competition,
  profile,
  utm,
  setClientInfo,
}: {
  competition: CompetitionInterface;
  profile: profileType | null;
  utm?: string;
  setClientInfo: (info: { firstName: string; email: string }) => void;
}) {
  const nextrouter = useNextRouter();
  const [coupon, setCoupon] = useState<ReferalType | null>(null);
  const { gift, challenge_answer, paymentStep, updatePaymentStep } =
    useCheckoutSteps();
  const { tickets } = useCart();

  const { mutateAsync: createOrderNew, isLoading: orderPosting } =
    api.payments.createOrder.useMutation({
      onSuccess: (data) => {
        nextrouter.push(data.payment_url);
      },
    });
  const { mutateAsync: updateProfile } = api.Users.UpdateUserData.useMutation();

  const form = useForm<CheckoutType>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstname: profile?.firstName ?? '',
      lastname: profile?.lastName ?? '',
      country:
        profile?.country && profile?.country.length <= 2
          ? profile.country
          : 'GB',
      zip: profile?.zipCode ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      phone: profile?.phone ?? '',
      email: profile?.email ?? '',
      subscribe_to_newsletter: true,
      accept_terms: true,
      isGift: false,
      date: subYears(new Date(), 18),
      coupon: undefined,
      utm: utm,
      challenge_answer: challenge_answer ?? false,
    },
  });

  const onSubmit = async (values: CheckoutType) => {
    try {
      const phone = values.phone;
      toast.loading('Creating order...');

      posthog?.capture('order_creation_attempted', {
        email: values.email,
        userId: profile?.id ?? null,
        competition_id: competition.id,
        tickets_number: tickets,
        coupon_code: coupon?.code,
      });

      const orderData = {
        address: values.address,
        country: values.country,
        email: gift ? gift.email : values.email,
        first_name: gift ? gift.name : values.firstname,
        last_name: gift ? '' : values.lastname,
        phone: gift ? gift.phone : phone,
        zip: values.zip,
        checkedEmail: values.subscribe_to_newsletter ?? false,
        checkedTerms: values.accept_terms ?? false,
        totalPrice: calculateTotal(tickets, competition.ticket_price, coupon)
          .total,
        town: values.city,
        date: values.date,
        coupon: tickets < 15 ? values.coupon : undefined,
        utm,
        challenge_answer: values.challenge_answer,
        ...(gift ? { gift } : {}),
      };
      setClientInfo({
        firstName: values.firstname,
        email: values.email,
      });
      const order = await createOrderNew({
        ...orderData,
        comps: [
          {
            competitionId: competition.id,
            totalPrice: calculateTotal(
              tickets,
              competition.ticket_price,
              coupon,
            ).total,
            ticketCount: tickets,
            affiliateCode: coupon?.code,
          },
        ],
      });

      posthog?.capture('order_created_new_flow', {
        orderId: order.id,
        competition_id: competition.id,
        success: true,
      });

      if (profile) {
        await updateProfile(values);
      }
      updatePaymentStep(true);
      toast.dismiss();
    } catch (error) {
      posthog?.capture('order_creation_failed', {
        competition_id: competition.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof Error) {
        toast.error('Error creating order please try again: ' + error.message);
      }
      return { error: 'Error creating order' };
    }
  };

  const getIcon = useFieldIcon();
  const Tcheckout = useTranslations('checkout');
  const Taccount = useTranslations('account');

  return (
    <div className='w-full flex flex-col gap-[60px]'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='w-full flex justify-center items-center p-3 md:p-0'>
            <div className='w-full lg:w-4/5 flex flex-col self-center'>
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-[60px]'>
                <div className='col-span-full xl:col-span-2'>
                  <div className='flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-4 md:mb-0'>
                    <p className='text-foreground text-[24px] font-bold uppercase tracking-tighter'>
                      {Tcheckout('billinginfo')}
                    </p>
                    {!profile && (
                      <p className='text-[#898989] text-[14px] font-medium'>
                        {Taccount('already_have_account')}{' '}
                        <Link
                          href='/login'
                          className='text-black underline font-bold'
                        >
                          {Taccount('connect_now')}
                        </Link>
                      </p>
                    )}
                  </div>

                  <div>
                    <div className='grid grid-col-1 md:grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='firstname'
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{Tcheckout('firstname')}</FormLabel>
                            <FormControl>
                              <Input {...field} icon={getIcon(fieldState)} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='lastname'
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{Tcheckout('lastname')}</FormLabel>
                            <FormControl>
                              <Input {...field} icon={getIcon(fieldState)} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className='grid grid-col-1 md:grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='country'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{Tcheckout('country')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select a country' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countriesWithCodes.map((country) => (
                                  <SelectItem
                                    key={country.countryCode}
                                    value={country.countryCode}
                                  >
                                    {country.countryName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='zip'
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{Tcheckout('zip')}</FormLabel>
                            <FormControl>
                              <Input {...field} icon={getIcon(fieldState)} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className='grid grid-col-1 md:grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='address'
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{Tcheckout('address')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                icon={getIcon(fieldState)}
                                placeholder='house number & street name'
                                className='placeholder:text-[12px] placeholder:text-[#898989] placeholder:font-medium'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='city'
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{Tcheckout('city')}</FormLabel>
                            <FormControl>
                              <Input {...field} icon={getIcon(fieldState)} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className='grid grid-col-1 md:grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='phone'
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>
                              {Tcheckout('phone')}
                              <span className='text-red-700'>*</span>
                            </FormLabel>
                            <FormControl>
                              <PhoneInput
                                {...field}
                                icon={getIcon(fieldState)}
                                defaultCountry={
                                  form.watch('country') as Country
                                }
                                international
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='email'
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{Tcheckout('email')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                icon={getIcon(fieldState)}
                                readOnly={profile ? true : false}
                              />
                            </FormControl>
                            <FormDescription className='text-[12px] text-[#898989] font-medium'>
                              {Tcheckout('confirmation_sent')}
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <GiftTicket className='w-full mt-[60px]' />
                </div>
                <div className='col-span-full xl:col-span-1 flex flex-col gap-4 items-center'>
                  <OrderSummary
                    form={form}
                    competition={competition}
                    coupon={coupon}
                    setCoupon={setCoupon}
                    paymentStep={paymentStep}
                    numberOfTickets={tickets}
                  />
                  <SwipeAnimatedButton
                    type='submit'
                    text={Tcheckout('proceed_to_check_out')}
                    className='w-full'
                    disabled={orderPosting}
                    loading={orderPosting}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
