'use client';

/**
 * @deprecated this is the old checkout step, we should remove it soon, keept here as a refrence
 */
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
import { env } from '@/env';
import { useFieldIcon } from '@/hooks/use-field-icon';
import type { CompetitionInterface } from '@/lib/interfaces';
import { sendConfirmationEmail } from '@/lib/sendConfirmationEmail';
import type { ReferalType, profileType } from '@/lib/types';
import { calculateTotal } from '@/lib/utils';
import { useCart } from '@/store/use-cart';
import { useCheckoutSteps } from '@/store/use-checkout-steps';
import { api } from '@/trpc/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { formatDate, subYears } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  getCountryCallingCode,
  parsePhoneNumber,
} from 'react-phone-number-input';
import { toast } from 'sonner';
import { z } from 'zod';
import { GiftTicket } from './git-ticket';
import { OrderSummary } from './order-summary';
import lookup from 'country-code-lookup';
import { order_paymentMethod as PaymentMethod } from '@/lib/prisma-enums';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countryList } from '@/lib/countryList';
import { sendGAEvent, sendGTMEvent } from '@next/third-parties/google';
import { useRouter } from '@/navigation';
import { posthog } from '@/lib/posthog';

const checkoutSchema = z.object({
  firstname: z.string().min(3),
  lastname: z.string().min(3),
  country: z.string().min(4),
  zip: z.string().min(4),
  address: z.string().min(4),
  city: z.string().min(4),
  phone: z
    .string()
    .min(4)
    .transform((input) => input.replace(/^[+]|^00|^0/, '').replace(/\s/g, ''))
    .refine((data) => /^\d+$/.test(data), {
      message:
        "Invalid phone number format. Only digits are allowed after stripping '+'/ '00' and spaces.",
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

const paypalScriptOptions = {
  clientId: env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '', // Make sure to replace this with your actual client ID
  currency: 'GBP',
};

export type CheckoutType = z.infer<typeof checkoutSchema>;

export function CheckoutStep({
  competition,
  profile,
  setClientFirstName,
  setClientEmail,
  utm,
}: Readonly<{
  competition: CompetitionInterface;
  profile: profileType | null;
  utm?: string;
  setClientFirstName: (profile: string) => void;
  setClientEmail: (email: string) => void;
}>) {
  const flagEnabled = true;
  console.log({ new_checkout: flagEnabled });
  const { paymentStep, updatePaymentStep, incStep } = useCheckoutSteps();
  const router = useRouter();
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [paymentStep]);

  const [coupon, setCoupon] = useState<ReferalType | null>(null);
  const { gift, challenge_answer } = useCheckoutSteps();
  const { tickets } = useCart();

  // const { mutateAsync: createOrder, isLoading: orderPosting } =
  //   api.Order.createOrderNew.useMutation();

  const { mutateAsync: createOrderNew, isLoading: orderPosting } =
    api.payments.createOrder.useMutation();
  // const { mutateAsync: updateStatus } = api.Order.updateStatus.useMutation();
  const { mutateAsync: setPendingStatus } =
    api.Order.pendingOrder.useMutation();
  const { mutateAsync: updateProfile } = api.Users.UpdateUserData.useMutation();

  //order id usestate
  const [orderId, setOrderId] = useState('');

  const form = useForm<CheckoutType>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstname: profile?.firstName ?? '',
      lastname: profile?.lastName ?? '',
      country: profile?.country ?? '',
      zip: profile?.zipCode ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      phone: profile?.phone ?? '',
      email: profile?.email ?? '',
      subscribe_to_newsletter: true,
      accept_terms: true,
      isGift: false,
      date: subYears(new Date(), 18), // default date is 18 years ago
      coupon: undefined,
      utm: utm,
      challenge_answer: challenge_answer ?? false,
    },
  });

  const onSubmit = async (values: CheckoutType) => {
    try {
      const phone = values.phone;
      if (phone.startsWith('0') || phone === '') {
        toast.error('Invalid phone number');
        return;
      }

      toast.loading('Creating order...');
      setClientEmail(values.email);

      // Track order attempt
      posthog?.capture('order_creation_attempted', {
        useNewOrderFlow: flagEnabled,
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
        phone: gift ? gift.phone.replace('+', '') : phone.replace('+', ''),
        zip: values.zip,
        checkedEmail: values.subscribe_to_newsletter ?? false,
        checkedTerms: values.accept_terms ?? false,
        totalPrice: calculateTotal(tickets, competition.ticket_price, coupon)
          .total,
        town: values.city,
        date: values.date,
        paymentMethod: PaymentMethod.PAYPAL,
        coupon: tickets < 15 ? values.coupon : undefined,
        utm,
        challenge_answer: values.challenge_answer,
        ...(gift ? { gift } : {}),
      };

      const order = await createOrderNew({
        ...orderData,
        comps: [
          {
            competitionId: competition.id,
            totalPrice: calculateTotal(tickets, competition.ticket_price).total,
            ticketCount: tickets,
            affiliateCode: coupon?.code,
          },
        ],
      });
      posthog?.capture('order_created_new_flow', {
        orderId: typeof order === 'string' ? order : order.id,
        competition_id: competition.id,
        success: true,
      });
      if (profile) {
        // Update profile informations
        toast.promise(updateProfile(values), {
          loading: 'Updating profile...',
          success: 'Profile updated',
          error: 'Error updating profile',
        });
      }
      setOrderId(typeof order === 'string' ? order : order.id);
      updatePaymentStep(true);
      setClientFirstName(values.firstname);
      toast.dismiss();
    } catch (error) {
      // Track failed order
      posthog?.capture('order_creation_failed', {
        orderId,
        competition_id: competition.id,
        useNewOrderFlow: flagEnabled,
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
  const Tcompetition = useTranslations('competition');
  const Taccount = useTranslations('account');

  return (
    <PayPalScriptProvider options={paypalScriptOptions}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='w-full flex justify-center items-center p-3 md:p-0'>
            <div className='w-full lg:w-4/5 flex flex-col self-center '>
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3  gap-x-12 gap-y-[60px]'>
                <div className='col-span-full  xl:col-span-2 '>
                  {paymentStep ? (
                    <>
                      <p className='text-foreground text-[24px] font-bold uppercase tracking-tighter mb-5'>
                        {Tcompetition('how_to_pay')}
                      </p>
                      <div className='flex flex-col xs:flex-row md:flex-col gap-4'>
                        <PayPalButtons
                          className='z-20 w-full'
                          createOrder={async (data, actions) => {
                            // Logic to create an order
                            await setPendingStatus(orderId);

                            const ordercreation = await actions.order.create({
                              intent: 'CAPTURE',
                              application_context: {
                                shipping_preference: 'NO_SHIPPING',
                                brand_name: 'Win u Watch',
                                locale: 'en-GB',
                                user_action: 'PAY_NOW',
                              },
                              payer: {
                                name: {
                                  given_name: form.getValues('firstname'),
                                  surname: form.getValues('lastname'),
                                },
                                email_address: form.getValues('email'),
                                address: {
                                  postal_code: form.getValues('zip'),
                                  country_code:
                                    lookup.byCountry(form.getValues('country'))
                                      ?.iso2 ?? 'FR',
                                  address_line_1: form.getValues('address'),
                                  admin_area_2: form.getValues('city'),
                                },

                                phone: {
                                  phone_number: {
                                    country_code: getCountryCallingCode(
                                      parsePhoneNumber(form.getValues('phone'))
                                        ?.country ?? 'FR',
                                    ),
                                    national_number: form
                                      .getValues('phone')
                                      .replaceAll(
                                        `+${getCountryCallingCode(
                                          parsePhoneNumber(
                                            form.getValues('phone'),
                                          )?.country ?? 'FR',
                                        )}`,
                                        '',
                                      ),
                                  },
                                  phone_type: 'MOBILE',
                                },

                                birth_date: formatDate(
                                  form.getValues('date'),
                                  'yyyy-MM-dd',
                                ),
                              },
                              purchase_units: [
                                {
                                  amount: {
                                    currency_code: 'GBP',
                                    value: calculateTotal(
                                      tickets,
                                      competition.ticket_price,
                                      coupon,
                                    ).total.toFixed(2),
                                  },
                                },
                              ],
                            });
                            sendGTMEvent({
                              event: 'order_created',
                              page_type: 'checkout',
                              order_id: orderId,
                              total_price: calculateTotal(
                                tickets,
                                competition.ticket_price,
                                coupon,
                              ).total.toFixed(2),
                            });
                            posthog?.capture('order_created', {
                              orderId,
                              ...data,
                            });
                            return ordercreation;
                          }}
                          onApprove={async (data, actions) => {
                            const details = await actions.order?.capture();
                            if (!details) {
                              toast.error('Error in capturing order');
                              return;
                            }
                            if (details.status === 'COMPLETED' && details.id) {
                              // toast.promise(
                              //   updateStatus({
                              //     id: orderId,
                              //     status: 'CONFIRMED',
                              //     paymentId: details.id,
                              //     tickets_number: tickets,
                              //     competition_id: competition.id,
                              //     coupon: coupon?.code,
                              //   }),
                              //   {
                              //     loading: 'Verifying paiment...',
                              //     success: 'Paiment successful',
                              //     error: 'Error in updating paiment status',
                              //   },
                              // );
                              if (window.AffTracker) {
                                window.AffTracker.setWebsiteUrl(
                                  'https://www.winuwatch.com/',
                                );
                                window.AffTracker.add_order({
                                  order_id: details.id,
                                  order_currency: 'GBP',
                                  order_total: calculateTotal(
                                    tickets,
                                    competition.ticket_price,
                                    coupon,
                                  ).total.toFixed(2),
                                  product_ids: competition.id,
                                });
                              }
                              toast.promise(
                                async () => {
                                  await sendConfirmationEmail({
                                    identifier: form.getValues('email'),
                                    order_id: orderId,
                                    competition: competition,
                                    buyer_name: `${form.getValues('firstname')} ${form.getValues('lastname')}`,
                                    gift: gift,
                                  });
                                },
                                {
                                  loading: 'Sending confirmation email...',
                                  success:
                                    'Confirmation email sent successfully, please verify mailbox',
                                  error:
                                    'Error sending confirmation email, we will resend it',
                                },
                              );
                            } else {
                              toast.error('Payment declined');
                              posthog?.capture('order_payment_failed', {
                                orderId,
                                ...data,
                              });
                            }
                            sendGAEvent({
                              category: 'Ecommerce',
                              action: 'Purchase',
                              label: 'Confirmation de commande',
                              value: calculateTotal(
                                tickets,
                                competition.ticket_price,
                                coupon,
                              ).total.toFixed(2),
                              quantity: tickets,
                              price: competition.ticket_price,
                            });
                            posthog?.capture('order_payment_successful', {
                              orderId,
                              ...data,
                            });
                            sendGTMEvent({
                              event: 'purchase',
                              page_type: 'confirmation',
                              order_id: orderId,
                              total_price: calculateTotal(
                                tickets,
                                competition.ticket_price,
                                coupon,
                              ).total.toFixed(2),
                            });
                            router.push(
                              `/competitions/${competition.id}/confirmation?order_id=${orderId}` as '/competitions/:id/confirmation',
                            );
                            //incStep(); //do this after the payment is completed
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
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
                                <FormControl className=''>
                                  <Input
                                    {...field}
                                    icon={getIcon(fieldState)}
                                  />
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
                                  <Input
                                    {...field}
                                    icon={getIcon(fieldState)}
                                  />
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
                                    {countryList.map((country) => (
                                      <SelectItem key={country} value={country}>
                                        {country}
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
                                  <Input
                                    {...field}
                                    icon={getIcon(fieldState)}
                                  />
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
                                  <Input
                                    {...field}
                                    icon={getIcon(fieldState)}
                                  />
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
                      <GiftTicket className='w-full  mt-[60px]' />
                    </>
                  )}
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
                  {!paymentStep && (
                    <SwipeAnimatedButton
                      type='submit'
                      text={Tcheckout('proceed_to_check_out')}
                      className='w-full'
                      disabled={orderPosting}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </PayPalScriptProvider>
  );
}
