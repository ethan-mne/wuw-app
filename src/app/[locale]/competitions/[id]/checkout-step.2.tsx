// @ts-nocheck
/* eslint-disable */
'use client';

/**
 * @deprecated this is the old checkout step, we should remove it soon, kept here as a reference
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
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { formatDate, subYears } from 'date-fns';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
import { captureOrder, createOrder } from './actions';

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
        "Invalid phone number format. Only digits are allowed after stripping '+', '00', and spaces.",
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
  const { paymentStep, updatePaymentStep } = useCheckoutSteps();
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

  const {
    mutateAsync: createOrderNew,
    isLoading: orderPosting,
    data: orderData,
  } = api.payments.createOrder.useMutation();
  const { mutateAsync: updateStatus } = api.Order.updateStatus.useMutation();
  const { mutateAsync: setPendingStatus } =
    api.Order.pendingOrder.useMutation();
  const { mutateAsync: updateProfile } = api.Users.UpdateUserData.useMutation();
  const [finalResponse, setFinalResponse] = useState<unknown | null>(null);

  // Apple Pay
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const appleButtonRef = useRef<HTMLButtonElement>(null);
  const [{ isResolved }] = usePayPalScriptReducer();
  const [applePayConfigState, setApplePayConfigState] = useState<{
    countryCode: string;
    merchantCapabilities: string[];
    supportedNetworks: string[];
  }>({
    countryCode: '',
    merchantCapabilities: [],
    supportedNetworks: [],
  });
  const amount = calculateTotal(
    tickets,
    competition.ticket_price,
    coupon,
  ).total;

  // Common functions for payment handling
  async function handleCreateOrder(orderData) {
    const { id, error } = await createOrder(
      orderData.id,
      orderData.price_to_pay,
      orderData.first_name,
      orderData.email,
      orderData.last_name,
    );
    if (error) {
      toast.error('Error creating order please try again: ' + error);
      throw new Error('Error creating order');
    }
    return id;
  }

  async function handleCapturePayment(orderId) {
    const { captureData, error } = await captureOrder(orderId);
    if (error) {
      toast.error('Error capturing order please try again: ' + error);
      throw new Error('Error capturing order');
    }
    return captureData;
  }

  async function handleSuccessfulPayment({
    captureData,
    orderData,
    tickets,
    competition,
    coupon,
    form,
    gift,
    router,
    data,
  }) {
    if (captureData.status === 'COMPLETED' && captureData.id) {
      // Update order status
      await updateStatus({
        id: orderData.id,
        status: 'CONFIRMED',
        paymentId: captureData.id,
        tickets_number: tickets,
        competition_id: competition.id,
        coupon: coupon?.code,
      });

      // Handle affiliate tracking
      if (window.AffTracker) {
        window.AffTracker.setWebsiteUrl('https://www.winuwatch.com/');
        window.AffTracker.add_order({
          order_id: captureData.id,
          order_currency: 'GBP',
          order_total: calculateTotal(
            tickets,
            competition.ticket_price,
            coupon,
          ).total.toFixed(2),
          product_ids: competition.id,
        });
      }

      // Send confirmation email
      await sendConfirmationEmail({
        identifier: form.getValues('email'),
        order_id: orderData.id,
        competition: competition,
        buyer_name: `${form.getValues('firstname')} ${form.getValues(
          'lastname',
        )}`,
        gift: gift,
      });

      // Track successful payment
      sendGAEvent({
        category: 'Ecommerce',
        action: 'Purchase',
        label: 'Order Confirmation',
        value: calculateTotal(
          tickets,
          competition.ticket_price,
          coupon,
        ).total.toFixed(2),
        quantity: tickets,
        price: competition.ticket_price,
      });

      posthog?.capture('order_payment_successful', {
        orderId: orderData.id,
        ...data,
      });

      sendGTMEvent({
        event: 'purchase',
        page_type: 'confirmation',
        order_id: orderData.id,
        total_price: calculateTotal(
          tickets,
          competition.ticket_price,
          coupon,
        ).total.toFixed(2),
      });

      // Redirect to confirmation page
      router.push(
        `/competitions/${competition.id}/confirmation?order_id=${orderData.id}` as '/competitions/:id/confirmation',
      );
    } else {
      throw new Error('Payment not completed');
    }
  }

  function handlePaymentError(error, orderData) {
    toast.error('Error in payment please try again: ' + error.message);
    posthog?.capture('order_payment_failed', {
      orderId: orderData?.id,
      error: error.message,
    });
  }

  // PayPal createOrder and onApprove functions
  const _createOrder = async (data, actions) => {
    if (!orderData) {
      throw new Error('Order data not found');
    }
    await setPendingStatus(orderData.id);
    const id = await handleCreateOrder(orderData);
    sendGTMEvent({
      event: 'order_created',
      page_type: 'checkout',
      order_id: orderData.id,
      total_price: calculateTotal(
        tickets,
        competition.ticket_price,
        coupon,
      ).total.toFixed(2),
    });
    posthog?.capture('order_created', {
      orderId: orderData.id,
      ...data,
    });
    return id;
  };

  const _onApprove = async (data, actions) => {
    try {
      const captureData = await handleCapturePayment(data.orderID);
      await handleSuccessfulPayment({
        captureData,
        orderData,
        tickets,
        competition,
        coupon,
        form,
        gift,
        router,
        data,
      });
    } catch (error) {
      handlePaymentError(error, orderData);
    }
  };

  // Apple Pay integration
  useEffect(() => {
    if (isResolved) {
      console.log('PayPal script resolved, checking Apple Pay availability');
      console.log('Current amount:', amount);
      if (typeof window !== 'undefined' && window.ApplePaySession) {
        const { ApplePaySession } = window;
        console.log('ApplePaySession available');
        if (!ApplePaySession.canMakePayments()) {
          console.log(
            'This device is not capable of making Apple Pay payments',
          );
          return;
        }
        console.log('Device can make Apple Pay payments, fetching config');
        const applepay = paypal.Applepay();
        applepay
          .config()
          .then((applePayConfig) => {
            if (applePayConfig.isEligible) {
              console.log('Apple Pay config received:', applePayConfig);
              setApplePayAvailable(true);
              setApplePayConfigState(applePayConfig);
            }
          })
          .catch((applepayConfigError) => {
            console.log('Error while fetching Apple Pay configuration.');
            console.log(applepayConfigError);
            toast.error('Error while fetching Apple Pay configuration.');
          });
      } else {
        console.log('Apple Pay not supported on this device/browser');
      }
    } else {
      console.log('PayPal script not yet resolved');
    }
  }, [isResolved]);
  console.log('applePayAvailable', applePayAvailable);
  useEffect(() => {
    if (applePayAvailable && appleButtonRef.current && amount > 0) {
      const { ApplePaySession } = window;
      const applepay = paypal.Applepay();
      appleButtonRef.current.onclick = async () => {
        try {
          if (!applePayConfigState) {
            toast.error('Apple Pay configuration not found');
            return;
          }

          const paymentRequest = {
            countryCode: applePayConfigState.countryCode,
            merchantCapabilities: applePayConfigState.merchantCapabilities,
            supportedNetworks: applePayConfigState.supportedNetworks,
            currencyCode: 'GBP',
            requiredShippingContactFields: [
              'name',
              'phone',
              'email',
              'postalAddress',
            ],
            requiredBillingContactFields: ['postalAddress'],
            total: {
              label: 'Tickets',
              type: 'final',
              amount: amount.toString(),
            },
          };

          const session = new ApplePaySession(4, paymentRequest);

          session.onvalidatemerchant = async (event) => {
            applepay
              .validateMerchant({
                validationUrl: event.validationURL,
                displayName: 'WINUWATCH',
              })
              .then((validateResult) => {
                console.log('Merchant validation successful');
                session.completeMerchantValidation(
                  validateResult.merchantSession,
                );
              })
              .catch((validateError) => {
                session.abort();
                toast.error('Error while validating merchant.');
              });
          };
          session.onpaymentauthorized = async (event) => {
            console.log('session.onpaymentauthorized');
            try {
              if (!orderData) {
                throw new Error('Order data not found');
              }

              // Set order to pending status first
              await setPendingStatus(orderData.id);

              // Create the order
              const id = await handleCreateOrder(orderData);

              // Confirm the order with Apple Pay
              await applepay.confirmOrder({
                orderId: id,
                token: event.payment.token,
                billingContact: event.payment.billingContact,
              });
              console.log(
                'session.completePayment(ApplePaySession.STATUS_SUCCESS)',
              );
              session.completePayment(ApplePaySession.STATUS_SUCCESS);

              // Capture the payment
              const captureData = await handleCapturePayment(id);

              // Handle successful payment
              await handleSuccessfulPayment({
                captureData,
                orderData,
                tickets,
                competition,
                coupon,
                form,
                gift,
                router,
                data: {},
              });

              setFinalResponse(captureData);
            } catch (error) {
              session.completePayment(ApplePaySession.STATUS_FAILURE);
              handlePaymentError(error, orderData);
            }
          };

          session.begin();
        } catch (error) {
          handlePaymentError(error, orderData);
        }
      };
    }
  }, [
    applePayAvailable,
    appleButtonRef,
    appleButtonRef.current,
    applePayConfigState,
  ]);

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
      date: subYears(new Date(), 18),
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
        // Update profile information
        toast.promise(
          updateProfile({
            firstname: values.firstname,
            lastname: values.lastname,
            phone: values.phone,
            zip: values.zip,
            address: values.address,
            city: values.city,
            country: values.country,
          }),
          {
            loading: 'Updating profile...',
            success: 'Profile updated',
            error: 'Error updating profile',
          },
        );
      }
      updatePaymentStep(true);
      setClientFirstName(values.firstname);
      toast.dismiss();
    } catch (error) {
      // Track failed order
      posthog?.capture('order_creation_failed', {
        orderId: orderData?.id,
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
    <Form {...form}>
      <p>{JSON.stringify(finalResponse)}</p>
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
                        createOrder={_createOrder}
                        onApprove={_onApprove}
                      />
                      {applePayAvailable && (
                        <div id='applepay-container'>
                          {/* @ts-ignore */}
                          <apple-pay-button
                            ref={appleButtonRef}
                            id='btn-appl'
                            buttonstyle='black'
                            className='w-full'
                            type='buy'
                            locale='en'
                          />
                        </div>
                      )}
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
  );
}
