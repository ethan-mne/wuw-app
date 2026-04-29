// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable  @typescript-eslint/restrict-template-expressions */
// import Footer from '@/components/Footer';
// import NavBar from '@/components/NavBar';
// import Head from 'next/head';
// import { z } from 'zod';
// import { type SetStateAction, useEffect, useState } from 'react';
// import styles from '@/styles/Checkout.module.css';
// import { useRouter } from 'next/router';
// import { api, Formater, type i18n } from '@/utils';
// import { useCart } from '@/components/Store';
// import { countryList } from '@/components/countries';
// import '@/styles/Checkout.module.css';
// import Image from 'next/image';
// import { Formik, Form, Field } from 'formik';
// import Datetime from 'react-datetime';
// import 'react-datetime/css/react-datetime.css';
// import { useTranslations } from 'next-intl';
// import PhoneInput, {
//   getCountryCallingCode,
//   parsePhoneNumber,
// } from 'react-phone-number-input';
// import * as Yup from 'yup';
// import 'react-phone-number-input/style.css';
// import Loader from '@/components/Loader';
// import Loader2 from '@/components/Loader2';
// import 'moment/locale/fr';
// import type {
//   GetServerSidePropsContext,
//   InferGetServerSidePropsType,
// } from 'next';
// import Link from 'next/link';
// import {
//   PayPalScriptProvider,
//   PayPalButtons,
//   usePayPalScriptReducer,
// } from '@paypal/react-paypal-js';
// import { env } from '@/env';

// const IsLegal = (Birthdate = new Date()) => {
//   const LegalAge = 18;
//   const now = new Date();
//   return (
//     new Date(
//       now.getFullYear() - LegalAge,
//       now.getMonth(),
//       now.getDate(),
//     ).getTime() >= Birthdate.getTime()
//   );
// };
// import lookup from 'country-code-lookup';

// const Schema = Yup.object().shape({
//   first_name: Yup.string().required('Required'),
//   last_name: Yup.string().required('Required'),
//   town: Yup.string().required('Required'),
//   zip: Yup.string().required('Required'),
//   phone: Yup.number(),
//   address: Yup.string().required('Required'),
//   country: Yup.string().required('Required'),
//   email: Yup.string().email('Invalid email').required('Required'),
//   checkedEmail: Yup.boolean()
//     .oneOf([true, false], 'Required')
//     .required('Required'),
//   checkedTerms: Yup.boolean().oneOf([true], 'Required').required('Required'),
// });
// export default function CheckoutPage({
//   id,
// }: InferGetServerSidePropsType<typeof getServerSideProps>) {
//   const { competitions: competitionsFromStore, reset } = useCart();
//   const [competitions, setCompetitions] = useState(competitionsFromStore);
//   const [ComputedTotal, setComputedTotal] = useState(0);
//   const t = useTranslations('checkout');
//   const router = useRouter();
//   const { mutateAsync: createOrder } = api.Order.createStripe.useMutation();
//   const { mutateAsync: updateStatus } =
//     api.Order.AddTicketsAfterConfirmation.useMutation();
//   const { mutateAsync: updatePaypalOrder } =
//     api.Order.updatePaypalOrder.useMutation();
//   const { data: items, isLoading } = api.Competition.getAll.useQuery({
//     ids: competitions.map((comp) => comp.compID),
//   });
//   const { data: order } = api.Order.getOrderCheck.useQuery(id);
//   const [error, setError] = useState<string | undefined>();
//   const {
//     mutateAsync: checkDiscount,
//     error: affiliationError,
//     data: affiliationData,
//   } = api.Affiliation.checkDiscount.useMutation({});
//   const [affiliationCode, setAffiliationCode] = useState<string | undefined>();

//   useEffect(() => {
//     setComputedTotal(
//       competitions.reduce(
//         (total, { number_tickets, price_per_ticket, compID, reduction }) => {
//           const discountRate =
//             affiliationData && affiliationData.competitionId === compID
//               ? affiliationData.discountAmount
//                 ? affiliationData.discountAmount / price_per_ticket
//                 : affiliationData.discountRate
//               : 0;
//           const totalPriceWReduction = reduction
//             ? number_tickets * price_per_ticket -
//               number_tickets * price_per_ticket * reduction
//             : number_tickets * price_per_ticket;
//           const totalPriceForCompetition = affiliationData?.isRunUpPrize
//             ? number_tickets * price_per_ticket - discountRate
//             : number_tickets * price_per_ticket * (1 - discountRate);

//           if (totalPriceForCompetition < 0) {
//             // error
//             return totalPriceForCompetition;
//           }

//           return affiliationData?.isRunUpPrize
//             ? total + totalPriceWReduction - discountRate
//             : total + totalPriceWReduction * (1 - discountRate);
//         },
//         0,
//       ),
//     );
//   }, [
//     affiliationData?.discountRate,
//     affiliationData?.discountAmount,
//     competitions,
//     affiliationData,
//   ]);
//   //TODO: THis doest server much besides confusing the browser
//   // useEffect(() => {
//   //   void (async () => {
//   //     if (competitions && competitions.length === 0) {
//   //       return await router.push("/Cart");
//   //     }
//   //   })();
//   // }, [items]);
//   useEffect(() => {
//     void (async () => {
//       if (
//         order &&
//         (order.status === 'CONFIRMED' || order.status === 'CANCELLED')
//       ) {
//         return await router.push('/');
//       }
//     })();
//   }, [order]);

//   const [isPaypal, setIsPaypal] = useState(false);
//   const [submiting, setSubmiting] = useState(false);

//   const PaypalSpinner = () => {
//     const [{ isPending }] = usePayPalScriptReducer();
//     return isPending ? (
//       <div
//         style={{
//           width: '100%',
//           display: 'grid',
//           placeItems: 'center',
//         }}
//       >
//         {' '}
//         <Loader />{' '}
//       </div>
//     ) : null;
//   };

//   return (
//     <div
//       style={{
//         textAlign: router.locale === 'il' ? 'right' : 'left',
//       }}
//     >
//       <Head>
//         <title>Win u Watch - Checkout</title>
//         <meta name='description' content='Win u Watch Checkout' />
//         <meta name='viewport' content='width=device-width, initial-scale=1' />
//         <link rel='icon' href='/favicon.ico' />
//       </Head>
//       <NavBar />
//       <div className={styles.CheckoutMain}>
//         {isLoading || submiting ? (
//           <div
//             style={{
//               height: '80vh',
//               width: '100%',
//               display: 'grid',
//               placeItems: 'center',
//             }}
//           >
//             <Loader />
//           </div>
//         ) : order &&
//           (order.status === 'CONFIRMED' || order.status === 'CANCELLED') ? (
//           <div>
//             <h1
//               style={{
//                 fontFamily: 'Iskry, sans-serif',
//                 textTransform: 'uppercase',
//               }}
//             >
//               This Order is Complete
//             </h1>
//             <p>you are being redirected shorly...</p>
//             <Loader />
//           </div>
//         ) : items?.length === 0 ? (
//           <div>
//             <h1
//               style={{
//                 fontFamily: 'Iskry, sans-serif',
//                 textTransform: 'uppercase',
//               }}
//             >
//               Your Cart is Empty
//             </h1>
//             <p>you are being redirected shorly...</p>
//             <Loader />
//           </div>
//         ) : (
//           items && (
//             <div className={styles.formMain}>
//               <Formik
//                 validationSchema={Schema}
//                 initialValues={{
//                   ...order,
//                   country:
//                     order?.country === null || !order
//                       ? 'France'
//                       : order.country,
//                   paymentMethod: 'PAYPAL',
//                   checkedEmail: true,
//                   checkedTerms: false,
//                   date: new Date(),
//                 }}
//                 onSubmit={async (values, { setSubmitting }) => {
//                   try {
//                     console.log('Form submitted:', values);
//                     // Check if ComputedTotal is negative
//                     if (ComputedTotal < 0) {
//                       if (affiliationData?.isRunUpPrize) {
//                         setError(
//                           'The total price of your order is negative, try making an order that fits the discount',
//                         );
//                       } else {
//                         setError('Total price cannot be negative, try again');
//                       }
//                       return;
//                     }

//                     const ValidatedValues = Schema.cast(values);
//                     const phone = ValidatedValues.phone
//                       ? ValidatedValues.phone.toString()
//                       : '';
//                     const zip = ValidatedValues.zip.toString();
//                     const totalPrice = ComputedTotal;

//                     const comps = affiliationData
//                       ? competitions.map((comp) => ({
//                           ...comp,
//                           reduction:
//                             affiliationData.competitionId === comp.compID
//                               ? affiliationData.isRunUpPrize
//                                 ? affiliationData.discountRate /
//                                   comp.number_tickets
//                                 : affiliationData.discountAmount
//                                 ? affiliationData.discountAmount /
//                                   comp.price_per_ticket
//                                 : affiliationData.discountRate
//                               : comp.reduction,
//                         }))
//                       : competitions;

//                     const paymentMethod = values.paymentMethod as
//                       | 'PAYPAL'
//                       | 'STRIPE';
//                     const date = new Date(values.date);
//                     const affiliationId = affiliationData?.isRunUpPrize
//                       ? ''
//                       : affiliationData?.id;
//                     const runUpPrizeId = affiliationData?.isRunUpPrize
//                       ? affiliationData.id
//                       : '';
//                     const locale = router.locale
//                       ? (router.locale as (typeof i18n)[number])
//                       : 'en';

//                     if (paymentMethod === 'PAYPAL') {
//                       await updatePaypalOrder({
//                         ...ValidatedValues,
//                         phone,
//                         id,
//                         zip,
//                         totalPrice,
//                         comps,
//                         paymentMethod,
//                         date,
//                         paymentId: '',
//                         affiliationId,
//                         runUpPrizeId,
//                         locale,
//                       });
//                       setIsPaypal(true);
//                     } else {
//                       const { url, error } = await createOrder({
//                         ...ValidatedValues,
//                         phone,
//                         id,
//                         zip,
//                         totalPrice,
//                         comps,
//                         paymentMethod,
//                         date,
//                         affiliationId,
//                         runUpPrizeId,
//                         locale,
//                       });

//                       if (url) {
//                         setSubmitting(false);
//                         await router.push(url);
//                       }

//                       setError(error);
//                       console.log(error);
//                     }

//                     setSubmitting(false);
//                   } catch (e) {
//                     setError(e as any);
//                   }
//                 }}
//               >
//                 {({
//                   values,
//                   isSubmitting,
//                   setValues,
//                   setFieldValue,
//                   errors,
//                   touched,
//                   handleSubmit,
//                 }) => (
//                   <Form>
//                     <div className={styles.CheckoutLeft}>
//                       <div className={styles.leftFormItem}>
//                         <h1>{t('billinginfo')}</h1>
//                         <div className={styles.CheckoutForm}>
//                           <div className={styles.formRow}>
//                             <div className={styles.formField}>
//                               <label htmlFor='firstName'>
//                                 {t('firstname')}
//                               </label>
//                               <Field
//                                 required
//                                 id='first_name'
//                                 type='text'
//                                 name='first_name'
//                               />
//                               {errors.first_name && touched.first_name ? (
//                                 <div style={{ color: 'red' }}>
//                                   {errors.first_name}
//                                 </div>
//                               ) : null}
//                             </div>
//                             <div className={styles.formField}>
//                               <label htmlFor='lastName'>{t('lastname')}</label>
//                               <Field
//                                 required
//                                 id='last_name'
//                                 type={'text'}
//                                 name='last_name'
//                               />
//                               {errors.last_name && touched.last_name ? (
//                                 <div style={{ color: 'red' }}>
//                                   {errors.last_name}
//                                 </div>
//                               ) : null}
//                             </div>
//                           </div>
//                           <div className={styles.formRow}>
//                             <div className={styles.formField}>
//                               <label htmlFor='Country'>{t('country')}</label>
//                               <Field
//                                 className={styles.countryList}
//                                 as='select'
//                                 required
//                                 id='country'
//                                 name='country'
//                                 value={values.country}
//                               >
//                                 <option value='0'>Select a Country</option>
//                                 {countryList.map((country, i) => (
//                                   <option key={i} value={country}>
//                                     {country}
//                                   </option>
//                                 ))}
//                               </Field>
//                               {errors.country && touched.country ? (
//                                 <div style={{ color: 'red' }}>
//                                   {errors.country}
//                                 </div>
//                               ) : null}
//                             </div>

//                             <div className={styles.formField}>
//                               <label htmlFor='lastName'>{t('zip')}</label>
//                               <Field
//                                 required
//                                 id='zip'
//                                 name='zip'
//                                 type='text'
//                                 min={0}
//                               />
//                               {errors.zip && touched.zip ? (
//                                 <div style={{ color: 'red' }}>{errors.zip}</div>
//                               ) : null}
//                             </div>
//                           </div>
//                           <div className={styles.formRow}>
//                             <div className={styles.formField}>
//                               <label htmlFor='lastName'>{t('address')}</label>
//                               <Field
//                                 required
//                                 id='address'
//                                 type='text'
//                                 name='address'
//                               />
//                               {errors.address && touched.address ? (
//                                 <div style={{ color: 'red' }}>
//                                   {errors.address}
//                                 </div>
//                               ) : null}
//                             </div>
//                             <div className={styles.formField}>
//                               <label htmlFor='Town'>{t('city')}</label>
//                               <Field
//                                 required
//                                 id='town'
//                                 type='text'
//                                 name='town'
//                               />
//                               {errors.town && touched.town ? (
//                                 <div style={{ color: 'red' }}>
//                                   {errors.town}
//                                 </div>
//                               ) : null}
//                             </div>
//                           </div>
//                           <div className={styles.formRow}>
//                             <div className={styles.formField}>
//                               <label htmlFor='Phone'>{t('phone')}</label>
//                               <PhoneInput
//                                 placeholder='Enter phone number'
//                                 name='phone'
//                                 required
//                                 countryCallingCodeEditable={false}
//                                 addInternationalOption={false}
//                                 defaultCountry={'FR'}
//                                 international={false}
//                                 limitMaxLength={true}
//                                 initialValueFormat='national'
//                                 id='phone'
//                                 onChange={(value) =>
//                                   void setFieldValue('phone', value)
//                                 }
//                               />
//                             </div>
//                             <div className={styles.formField}>
//                               <label htmlFor='Email'>{t('email')}</label>
//                               <Field
//                                 required
//                                 id='email'
//                                 name='email'
//                                 type='Email'
//                               />
//                               {errors.email && touched.email && (
//                                 <div style={{ color: 'red' }}>
//                                   {errors.email}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                           <div className={styles.FinalRow}>
//                             <div className={styles.formField}>
//                               <label htmlFor='Date'>{t('dateofbirth')}</label>
//                               <label
//                                 style={{
//                                   fontSize: '12px',
//                                 }}
//                               >
//                                 (DD/MM/YYYY)
//                               </label>
//                               <Datetime
//                                 utc={true}
//                                 input={true}
//                                 dateFormat={'DD/MM/YYYY'}
//                                 timeFormat={false}
//                                 initialValue={new Date('2000-01-01')}
//                                 isValidDate={(currentDate) =>
//                                   IsLegal(new Date(currentDate as Date))
//                                 }
//                                 inputProps={{
//                                   name: 'date',
//                                   placeholder: 'Enter Date',
//                                   required: true,
//                                   max: '2005-01-01',
//                                 }}
//                                 onChange={(value) => {
//                                   try {
//                                     const isValidDateString = (
//                                       dateString: string,
//                                     ): boolean => {
//                                       const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
//                                       const isValidFormat =
//                                         dateRegex.test(dateString);

//                                       if (!isValidFormat) {
//                                         return false; // date string does not match format DD/MM/YYYY
//                                       }

//                                       const [day, month, year] = dateString
//                                         .split('/')
//                                         .map((str) => parseInt(str, 10));
//                                       const date = new Date(
//                                         year as number,
//                                         (month as number) - 1,
//                                         day,
//                                       );
//                                       const minDate = new Date();
//                                       minDate.setFullYear(
//                                         minDate.getFullYear() - 18,
//                                       );

//                                       const isValidDate =
//                                         date.getFullYear() === year &&
//                                         date.getMonth() ===
//                                           (month as number) - 1 &&
//                                         date.getDate() === day;
//                                       const isOver18 = date <= minDate;

//                                       return isValidDate && isOver18;
//                                     };

//                                     if (
//                                       typeof value === 'string' &&
//                                       !isValidDateString(value)
//                                     ) {
//                                       setError(
//                                         'Date contains invalid characters',
//                                       );
//                                     } else {
//                                       setError('');
//                                     }
//                                     void setFieldValue('date', value);
//                                   } catch (error) {
//                                     console.error(error);
//                                   }
//                                 }}
//                               />

//                               {
//                                 //TODO: THis should be translated
//                                 error && <p style={{ color: 'red' }}>{error}</p>
//                               }
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       {/* Insert coupon */}
//                       <div className={styles.leftFormItem}>
//                         <h1>
//                           {/* {t("coupon")} */} {t('havediscount')}
//                         </h1>
//                         <div className={styles.CouponInput}>
//                           <Field
//                             type='text'
//                             name='coupon'
//                             placeholder={t('enterDiscount')}
//                             onChange={(e: {
//                               target: {
//                                 value: SetStateAction<string | undefined>;
//                               };
//                             }) => {
//                               setAffiliationCode(e.target.value);
//                             }}
//                           />
//                           <a
//                             onClick={(): void => {
//                               void checkDiscount({
//                                 discountCode: affiliationCode || '',
//                                 competitionIds:
//                                   competitions.map((comp) => comp.compID) || [],
//                               });
//                             }}
//                           >
//                             {t('add')}
//                           </a>
//                         </div>
//                         {!!affiliationError ? (
//                           <p style={{ color: 'red' }}>
//                             {affiliationError.message}
//                           </p>
//                         ) : null}
//                       </div>
//                       <div className={styles.leftFormItem}>
//                         {/* <h1>{t("paymethod")}</h1>
//                         <div className={styles.PaymentMethod}>
//                           <div className={styles.method}>
//                             <Field
//                               type="radio"
//                               name="paymentMethod"
//                               value="PAYPAL"
//                             />
//                             <p
//                               style={{
//                                 color:
//                                   values.paymentMethod === "PAYPAL"
//                                     ? "#987358"
//                                     : "rgba(30, 30, 30, 0.6)",
//                               }}
//                             >
//                               PayPal
//                             </p>
//                           </div>
//                           <div className={styles.method}>
//                             <Field
//                               type="radio"
//                               name="paymentMethod"
//                               value="STRIPE"
//                             />
//                             <p
//                               style={{
//                                 color:
//                                   values.paymentMethod === "STRIPE"
//                                     ? "#987358"
//                                     : "rgba(30, 30, 30, 0.6)",
//                               }}
//                             >
//                               {t("creditcard")}
//                             </p>
//                           </div>
//                         </div> */}
//                         <div className={styles.SignMeUp}>
//                           <label>
//                             <Field
//                               required
//                               name='checkedTerms'
//                               type='checkbox'
//                             />
//                             <p className={styles.termsTxt}>
//                               {`${t('condition')} `}
//                               <Link href='/TermsAndConditions'>
//                                 {t('terms&conds')}
//                               </Link>
//                               {`, ${t('including')} `}
//                               <Link href='/Return_Policy'>{t('return')}</Link>
//                               {', '}
//                               <Link href='/FAQ'>{t('faq')}</Link>
//                               {', '}
//                               <Link href='/Acceptable_Use_Policy'>
//                                 {t('acc_use_policy')}
//                               </Link>
//                               {`, ${t('and')} `}
//                               <Link href='/Privacy_Policy'>
//                                 {t('privacy_police')}
//                               </Link>
//                               .
//                             </p>
//                           </label>
//                           <label>
//                             <Field
//                               checked={values.checkedEmail}
//                               name='checkedEmail'
//                               type='checkbox'
//                             />
//                             <p className={styles.emailTxt}>{t('terms')}</p>
//                           </label>
//                         </div>
//                       </div>
//                     </div>
//                     <div className={styles.CheckoutRight}>
//                       <h1> {t('ordersum')} </h1>
//                       <div className={styles.RightCon}>
//                         <div className={styles.OrdersFlex}>
//                           {competitions.map((order, i) => {
//                             const ComptetionData = items.find(
//                               (compData) => compData.id === order.compID,
//                             );

//                             return !ComptetionData ||
//                               ComptetionData.Watches === null ? null : (
//                               <div className={styles.orderItem} key={i}>
//                                 <Image
//                                   width={106}
//                                   height={105}
//                                   className={styles.orderImg}
//                                   src={
//                                     ComptetionData.Watches.images_url[0]
//                                       ? ComptetionData.Watches.images_url[0].url
//                                       : '/images/tester.png'
//                                   }
//                                   alt='watching'
//                                 />
//                                 <div className={styles.orderTit}>
//                                   <h3>
//                                     {ComptetionData?.Watches.brand}{' '}
//                                     {ComptetionData?.Watches.model}
//                                   </h3>

//                                   <span>
//                                     {competitions
//                                       .filter(
//                                         (comp) => comp.compID === order.compID,
//                                       )
//                                       .map(
//                                         (
//                                           { number_tickets, price_per_ticket },
//                                           i,
//                                         ) => (
//                                           <p key={i}>
//                                             {Formater(
//                                               number_tickets * price_per_ticket,
//                                               router.locale,
//                                             )}
//                                           </p>
//                                         ),
//                                       )}
//                                   </span>
//                                   {order.reduction > 0 && (
//                                     <div
//                                       style={{
//                                         color: '#a8957e',
//                                         display: 'flex',
//                                         justifyContent: 'space-between',
//                                       }}
//                                     >
//                                       <p
//                                         style={{
//                                           color: '#a8957e',
//                                         }}
//                                       >
//                                         {t('discount')}
//                                       </p>
//                                       <p
//                                         style={{
//                                           color: '#a8957e',
//                                           padding: '0 72px 0 0',
//                                           display: 'flex',
//                                           alignItems: 'center',
//                                           gap: '1rem',
//                                         }}
//                                       >
//                                         <p>{order.reduction * 100}% OFF</p>
//                                         {`\t${Formater(
//                                           order.reduction *
//                                             (order.number_tickets *
//                                               ComptetionData.ticket_price),
//                                           router.locale,
//                                         )}`}
//                                       </p>
//                                     </div>
//                                   )}
//                                   {affiliationData &&
//                                   affiliationData.competitionId ===
//                                     ComptetionData.id ? (
//                                     <div>
//                                       <div className={styles.coupon}>
//                                         <p
//                                           style={{ color: '#a8957e' }}
//                                         >{`Coupon`}</p>
//                                         <div className={styles.couponRate}>
//                                           <p
//                                             style={{
//                                               color: '#a8957e',
//                                               padding: '0 72px 0 0',
//                                               display: 'flex',
//                                               alignItems: 'center',
//                                               gap: '1rem',
//                                             }}
//                                           >
//                                             <p>
//                                               {affiliationData.discountRate *
//                                                 100}
//                                               % OFF
//                                             </p>
//                                             {affiliationData.isRunUpPrize
//                                               ? Formater(
//                                                   affiliationData.discountRate,
//                                                 )
//                                               : !!affiliationData.discountAmount
//                                               ? Formater(
//                                                   affiliationData.discountAmount,
//                                                 )
//                                               : Formater(
//                                                   affiliationData.discountRate *
//                                                     (order.reduction
//                                                       ? order.number_tickets *
//                                                           order.price_per_ticket -
//                                                         order.number_tickets *
//                                                           order.price_per_ticket *
//                                                           order.reduction
//                                                       : order.number_tickets *
//                                                         order.price_per_ticket),
//                                                   router.locale,
//                                                 )}
//                                           </p>
//                                         </div>
//                                       </div>
//                                     </div>
//                                   ) : null}
//                                   {competitions[competitions.length - 1] ===
//                                   competitions[i] ? (
//                                     <div className={styles.OrdersFlexBotSum}>
//                                       <div className={styles.orderSum}>
//                                         <p>{`TOTAL`}</p>
//                                         <div className={styles.totalOrder}>
//                                           <span>
//                                             {Formater(
//                                               ComputedTotal,
//                                               router.locale,
//                                             )}
//                                           </span>
//                                           <p
//                                             style={{
//                                               textDecoration: 'underline',
//                                               color: '#987358',
//                                               fontWeight: '300',
//                                               fontSize: '10px',
//                                               textTransform: 'uppercase',
//                                               cursor: 'pointer',
//                                             }}
//                                             onClick={() => {
//                                               reset();
//                                               setCompetitions([]);
//                                             }}
//                                           >
//                                             {t('clearcart')}
//                                           </p>
//                                         </div>
//                                       </div>
//                                     </div>
//                                   ) : null}
//                                 </div>
//                                 {/* <div className={styles.Counter}>
//                               <div
//                                 onClick={() => {
//                                   const number_tickets =
//                                     order.number_tickets > 1
//                                       ? order.number_tickets - 1
//                                       : order.number_tickets;
//                                   updateComp({
//                                     compID: order.compID,
//                                     number_tickets,
//                                     price_per_ticket: order.price_per_ticket,
//                                   });
//                                   setValues({
//                                     ...values,
//                                     comps: values.comps.map((comp) => {
//                                       if (comp.compID === order.compID) {
//                                         return {
//                                           ...comp,
//                                           number_tickets,
//                                         };
//                                       }
//                                       return comp;
//                                     }),
//                                   });
//                                 }}
//                                 className={styles.CounterSelec}
//                               >
//                                 <Image
//                                   width={13}
//                                   height={1}
//                                   src="/images/Minus.png"
//                                   alt="minus"
//                                 />
//                               </div>
//                               <div className={styles.counterValue}>
//                                 {values.comps.map(
//                                   (comp) => comp.number_tickets
//                                 )}
//                               </div>
//                               <div
//                                 onClick={() => {
//                                   const number_tickets =
//                                     order.number_tickets >
//                                       ComptetionData.remaining_tickets ||
//                                     order.number_tickets >= 25
//                                       ? order.number_tickets
//                                       : order.number_tickets + 1;

//                                   updateComp({
//                                     compID: order.compID,
//                                     number_tickets,
//                                     price_per_ticket: order.price_per_ticket,
//                                   });
//                                   setValues({
//                                     ...values,
//                                     comps: values.comps.map((comp) => {
//                                       if (comp.compID === order.compID) {
//                                         return {
//                                           ...comp,
//                                           number_tickets,
//                                         };
//                                       }
//                                       return comp;
//                                     }),
//                                   });
//                                 }}
//                                 className={styles.CounterSelec}
//                               >
//                                 <Image
//                                   width={11}
//                                   height={11}
//                                   src="/images/plus.png"
//                                   alt="plus"
//                                 />
//                               </div>
//                             </div> */}
//                               </div>
//                             );
//                           })}
//                         </div>

//                         {values.paymentMethod === 'PAYPAL' ? (
//                           <div className={styles.paypal}>
//                             {isPaypal ? (
//                               <div style={{ marginTop: '20px' }}>
//                                 <PayPalScriptProvider
//                                   options={{
//                                     'client-id': `${env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}`,
//                                     currency: 'GBP',
//                                   }}
//                                 >
//                                   <PaypalSpinner />
//                                   <PayPalButtons
//                                     createOrder={(data, actions) => {
//                                       return actions.order.create({
//                                         application_context: {
//                                           shipping_preference: 'NO_SHIPPING',
//                                           brand_name: 'Win u Watch',
//                                           locale: 'en-GB',
//                                           user_action: 'PAY_NOW',
//                                         },
//                                         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//                                         //@ts-ignore
//                                         payer: {
//                                           name: {
//                                             given_name:
//                                               values.first_name || undefined,
//                                             surname:
//                                               values.last_name || undefined,
//                                           },
//                                           email_address: values.email as string,
//                                           address: {
//                                             postal_code:
//                                               values.zip || undefined,
//                                             country_code:
//                                               lookup.byCountry(values.country)
//                                                 ?.iso2 || 'FR',
//                                           },
//                                           phone: {
//                                             phone_number: {
//                                               national_number:
//                                                 values.phone?.replaceAll(
//                                                   `+${getCountryCallingCode(
//                                                     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//                                                     //@ts-ignore
//                                                     parsePhoneNumber(
//                                                       values.phone,
//                                                     )?.country,
//                                                   )}`,
//                                                   '',
//                                                 ) as string,
//                                             },
//                                             phone_type: 'MOBILE',
//                                           },
//                                           tenant: '',
//                                           birth_date: '2000-01-01',
//                                         },
//                                         purchase_units: [
//                                           {
//                                             amount: {
//                                               value: String(ComputedTotal),
//                                             },
//                                           },
//                                         ],
//                                       });
//                                     }}
//                                     onApprove={(data, actions) => {
//                                       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//                                       //@ts-ignore
//                                       return actions.order
//                                         .capture()
//                                         .then(async (details) => {
//                                           if (details.status === 'COMPLETED') {
//                                             typeof window !== 'undefined' &&
//                                               window.scrollTo(0, 0);
//                                             setSubmiting(true);
//                                             await updateStatus({
//                                               id: id,
//                                               status: 'CONFIRMED',
//                                               paymentId: details.id.toString(),
//                                               comps: competitionsFromStore,
//                                             }).then(async () => {
//                                               reset();
//                                               setCompetitions([]);
//                                               await router.push(
//                                                 `/Confirmation/${id}`,
//                                               );
//                                             });
//                                           } else {
//                                             setError('Payment Failed');
//                                             // throw new Error(
//                                             //   "Payment Failed"
//                                             // );
//                                           }
//                                         });
//                                     }}
//                                   />
//                                 </PayPalScriptProvider>
//                               </div>
//                             ) : (
//                               <button
//                                 type='submit'
//                                 className={styles.paypalBtn}
//                               >
//                                 Continue
//                               </button>
//                             )}
//                           </div>
//                         ) : (
//                           <div className={styles.orderSumBot}>
//                             <button
//                               disabled={isSubmitting || error ? true : false}
//                               style={{
//                                 backgroundColor: error
//                                   ? 'rgba(30, 30, 30, 0.3)'
//                                   : isSubmitting
//                                   ? '#cbb9ac'
//                                   : '#cbb9ac',
//                                 cursor:
//                                   isSubmitting || error ? 'default' : 'pointer',
//                               }}
//                               type='submit'
//                               onClick={() => {
//                                 if (!values.checkedTerms)
//                                   return alert(`${t('shouldacceptterms')}`);
//                               }}
//                             >
//                               {isSubmitting ? <Loader2 /> : t('confirmorder')}
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </Form>
//                 )}
//               </Formik>
//             </div>
//           )
//         )}
//       </div>
//       <Footer />
//     </div>
//   );
// }

// export async function getServerSideProps(context: GetServerSidePropsContext) {
//   const { id } = context.query;
//   return {
//     props: {
//       id: z.string().parse(id),
//       //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions
//       messages: (await import(`../../../messages/${context.locale}.json`))
//         .default,
//     },
//   };
// }
