// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable  @typescript-eslint/restrict-template-expressions */
// import Footer from '@/components/Footer';
// import NavBar from '@/components/NavBar';
// import Head from 'next/head';
// import { useRouter } from 'next/router';
// import { api } from '@/utils/api';
// import { z } from 'zod';
// import type {
//   GetServerSidePropsContext,
//   InferGetServerSidePropsType,
// } from 'next';
// import styles from '@/styles/CompetitionPage.module.css';
// import { useCart } from '@/components/Store';
// import ToggleButton from '@mui/material/ToggleButton';
// import { Formater, DateFormater, Charities, TICKETREDUC } from '@/utils';
// import { useState } from 'react';
// import Image from 'next/image';
// import Loader from '@/components/Loader';
// import Timer from '@/components/Timer';
// import { useTranslations } from 'next-intl';

// export async function getServerSideProps(context: GetServerSidePropsContext) {
//   try {
//     const compID = z.string().parse(context.params?.id);
//     return {
//       props: {
//         compID,
//         messages: (await import(`../../../messages/${context.locale}.json`))
//           .default,
//       },
//     };
//   } catch (e) {
//     console.log(e);
//     return {
//       redirect: {
//         destination: '/404',
//         permanent: false,
//       },
//     };
//   }
// }

// export default function Competition({
//   compID,
// }: InferGetServerSidePropsType<typeof getServerSideProps>) {
//   const t = useTranslations('competition');
//   const { data, isLoading } = api.Competition.GetUniqueByID.useQuery(compID);
//   const [counter, setCounter] = useState({
//     value: 1,
//     reduction: 0,
//   });
//   const { data: nextComp } = api.Order.getNextComp.useQuery(compID);
//   // const [filter, setFilter] = useState(5);
//   const { addComp, updateComp, competitions } = useCart();
//   const [image, setImage] = useState<string | undefined>(undefined);
//   const router = useRouter();
//   const [redirecting, setRedirecting] = useState(false);
//   return (
//     <div
//       style={{
//         textAlign: router.locale === 'il' ? 'right' : 'left',
//       }}
//     >
//       <Head>
//         <title>
//           Win u Watch
//           {data !== null && data && data.Watches !== null
//             ? ' - ' + data.Watches.brand
//             : ''}
//         </title>
//         <meta name='description' content='Win u Watch Competition' />
//         <meta name='viewport' content='width=device-width, initial-scale=1' />
//         <link rel='icon' href='/favicon.ico' />
//       </Head>
//       {/*
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           height: "fit-content",
//           width: "100%",
//           backgroundColor: "#a8957e",
//           color: "white",
//           padding: "15px",
//           fontFamily: "Montserrat",
//           textAlign: "center",
//           fontSize: "14px",
//         }}
//       >
//         {t("banner")}
//       </div>*/}
//       <NavBar />
//       {isLoading || redirecting ? (
//         <div
//           style={{
//             height: '80vh',
//             display: 'grid',
//             placeItems: 'center',
//           }}
//         >
//           <Loader />
//         </div>
//       ) : (
//         data !== null &&
//         data &&
//         data.Watches !== null &&
//         data.Watches && (
//           <div className={styles.compWrapper}>
//             <div className={styles.CompetitionMain}>
//               <div className={styles.images}>
//                 {data.Watches.images_url[0]?.url && (
//                   <Image
//                     width={450}
//                     height={440}
//                     style={{ objectFit: 'cover' }}
//                     alt='watchImage'
//                     className={styles.MainImage}
//                     src={image ? image : data.Watches.images_url[0]?.url}
//                   />
//                 )}

//                 <div className={styles.innerImages}>
//                   {
//                     // new array of image besides the first one
//                     data.Watches.images_url.slice(1, 4).map(({ url }, i) => (
//                       <Image
//                         onMouseEnter={() => setImage(url)}
//                         onMouseLeave={() => setImage(undefined)}
//                         width={150}
//                         height={130}
//                         alt='watchImage'
//                         src={url}
//                         key={i}
//                       />
//                     ))
//                   }
//                 </div>
//               </div>
//               <div className={styles.CompRight}>
//                 <div className={styles.CompTit}>
//                   <h1>{data.name}</h1>
//                   <p>
//                     {t('marketvalue')} {Formater(data.price, router.locale)}
//                   </p>
//                 </div>
//                 <div className={styles.CompTicketSelec}>
//                   {data.remaining_tickets === 0 ||
//                   data.end_date < new Date() ? (
//                     <>
//                       <h3>{t('drawDate')}</h3>
//                       <Timer displayFlex={true} date={data.drawing_date} />
//                     </>
//                   ) : data.start_date > new Date() ? (
//                     <>
//                       <h3>{t('startcomp')}</h3>
//                       <Timer displayFlex={true} date={data.start_date} />
//                     </>
//                   ) : (
//                     <h3>{t('howmany')}</h3>
//                   )}
//                   {data.start_date < new Date() && (
//                     <div className={styles.tickets}>
//                       {data.remaining_tickets <= 0 ||
//                       data.end_date < new Date() ? (
//                         <p>{t('noticketleft')}</p>
//                       ) : (
//                         TICKETREDUC.filter(
//                           ({ value }) => value <= data.remaining_tickets,
//                           // && value <= filter
//                         ).map(({ value: item, reduction }, i) => {
//                           // const TheReduction = 0;
//                           return (
//                             <div
//                               key={i}
//                               style={{
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 alignItems: 'center',
//                                 justifyContent: 'flex-start',
//                                 gap: '0.5rem',
//                                 width: reduction > 0 ? '102px' : '55px',
//                                 marginRight: reduction > 0 ? '1rem' : '0',
//                               }}
//                               className={styles.ticket}
//                             >
//                               <ToggleButton
//                                 onClick={() =>
//                                   setCounter({
//                                     value: item,
//                                     reduction: reduction,
//                                   })
//                                 }
//                                 disabled={item > data.remaining_tickets}
//                                 sx={{
//                                   cursor:
//                                     item > data.remaining_tickets
//                                       ? 'help'
//                                       : 'pointer',
//                                   width: reduction > 0 ? '100px' : '55px',
//                                   borderRadius:
//                                     reduction > 0 ? '25px !important' : '50%',
//                                   height: '55px',
//                                   backgroundColor:
//                                     counter.value === item
//                                       ? 'rgb(146, 124, 102, 0.5)'
//                                       : 'initial',
//                                   color:
//                                     counter.value === item
//                                       ? 'white !important'
//                                       : 'initial',
//                                   border:
//                                     counter.value === item
//                                       ? '2px solid rgb(146, 124, 102) !important'
//                                       : 'initial',
//                                 }}
//                                 value={item}
//                                 aria-label='left aligned'
//                               >
//                                 <span
//                                   style={{
//                                     fontSize: reduction > 0 ? '18px' : '24px',
//                                     height: reduction > 0 ? '23px' : 'initial',
//                                   }}
//                                 >
//                                   {item}
//                                   {reduction ? 'T' : ''}
//                                 </span>
//                                 <p
//                                   style={{
//                                     fontSize: '12px',
//                                     fontWeight: '600',
//                                   }}
//                                   className={styles.sold}
//                                 >
//                                   {reduction > 0 && `-${reduction * 100}%`}
//                                 </p>
//                               </ToggleButton>
//                               {reduction > 0 && item === 15 ? (
//                                 <p
//                                   style={{
//                                     width: '7rem',
//                                     textAlign: 'center',
//                                     fontWeight: '600',
//                                     fontSize: '14px',
//                                   }}
//                                 >
//                                   15 tickets = 1/
//                                   {(data.total_tickets / 15).toFixed(0)} chance
//                                   to win !
//                                 </p>
//                               ) : reduction > 0 && item === 20 ? (
//                                 <p
//                                   style={{
//                                     width: '7rem',
//                                     textAlign: 'center',
//                                     fontWeight: '600',
//                                     fontSize: '14px',
//                                   }}
//                                 >
//                                   20 tickets = 1/
//                                   {(data.total_tickets / 20).toFixed(0)} chance
//                                   to win !
//                                 </p>
//                               ) : reduction > 0 && item === 25 ? (
//                                 <p
//                                   style={{
//                                     width: '7rem',
//                                     textAlign: 'center',
//                                     fontWeight: '600',

//                                     fontSize: '14px',
//                                   }}
//                                 >
//                                   25 tickets = 1/
//                                   {(data.total_tickets / 25).toFixed(0)} chance
//                                   to win !
//                                 </p>
//                               ) : reduction > 0 && item === 50 ? (
//                                 <p
//                                   style={{
//                                     width: '7rem',
//                                     textAlign: 'center',
//                                     fontWeight: '600',

//                                     fontSize: '14px',
//                                   }}
//                                 >
//                                   50 tickets = 1/
//                                   {(data.total_tickets / 50).toFixed(0)} chance
//                                   to win !
//                                 </p>
//                               ) : null}
//                             </div>
//                           );
//                         })
//                       )}
//                       {/* <button
//                         style={{
//                           display:
//                             filter === MAX_TICKETS ||
//                             data.remaining_tickets <= 0 ||
//                             data.end_date < new Date()
//                               ? "none"
//                               : "flex",
//                         }}
//                         onClick={() => setFilter(MAX_TICKETS)}
//                         className={styles.showMore}
//                       >
//                         +
//                       </button> */}
//                     </div>
//                   )}
//                 </div>
//                 <div
//                   style={{
//                     flexDirection: 'column',
//                     alignItems: nextComp ? 'flex-end' : 'flex-start',
//                   }}
//                   className={styles.CompBot}
//                 >
//                   <div
//                     style={
//                       router.locale === 'il'
//                         ? {
//                             justifyContent: 'flex-end',
//                             marginRight: '0px',
//                           }
//                         : {
//                             justifyContent: 'flex-start',
//                           }
//                     }
//                     className={styles.donations}
//                   >
//                     <h3>{t('freeTicket')}</h3>
//                     {t('donatedto')}
//                     {nextComp ? (
//                       <p>
//                         {nextComp?.Watches?.model}
//                         {t('nextText')}
//                         {nextComp?.Watches?.model}
//                       </p>
//                     ) : (
//                       <>{t('donatedto2')}</>
//                     )}
//                   </div>
//                   <div
//                     style={{
//                       display: 'flex',

//                       width: '100%',
//                       justifyContent: 'space-between',
//                     }}
//                     className={styles.CompBotBot}
//                   >
//                     <div
//                       style={{
//                         display: 'flex',
//                         flexDirection: 'column',
//                         gap: '0.5rem',
//                         alignItems: 'flex-start',
//                         justifyContent: 'flex-start',
//                         height: '100%',
//                         width: '70%',
//                       }}
//                       className={styles.compSponsors}
//                     >
//                       <p
//                         style={{
//                           //width: "70%",
//                           color: 'rgba(0, 0, 0, 0.6)',
//                         }}
//                       >
//                         {t('donated')}
//                       </p>
//                       {Charities.map((item, charityIndex) => (
//                         <div
//                           style={{
//                             display: 'flex',
//                           }}
//                           key={charityIndex}
//                           className={styles.compSponsors}
//                         >
//                           <Image
//                             width={130}
//                             height={70}
//                             alt='donation'
//                             style={{
//                               objectFit: 'contain',
//                               mixBlendMode: 'darken',
//                             }}
//                             src={item.img}
//                           />
//                           <div>
//                             <h1
//                               style={{
//                                 fontSize: '20px',
//                                 fontWeight: '500',
//                               }}
//                             >
//                               {t(item.name)}
//                             </h1>
//                             <p
//                               style={{
//                                 color: 'rgba(30, 30, 30, 0.68)',
//                                 fontWeight: '400',
//                                 fontSize: '14px',
//                               }}
//                             >
//                               {t(item.desc)}
//                             </p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>

//                     {data.remaining_tickets === 0 || data.end_date < new Date()
//                       ? ''
//                       : data.start_date < new Date() && (
//                           <div className={styles.addtoCart}>
//                             <div className={styles.prices}>
//                               {router.locale === 'il' ? (
//                                 <p>
//                                   {`${Formater(
//                                     data.ticket_price,
//                                     router.locale,
//                                   )} x ${counter.value} ${t('tickets')}`}
//                                 </p>
//                               ) : (
//                                 <p>
//                                   {`${t('tickets')} ${
//                                     counter.value
//                                   } x ${Formater(
//                                     data.ticket_price,
//                                     router.locale,
//                                   )}`}
//                                 </p>
//                               )}

//                               {counter.reduction > 0 && (
//                                 <p>
//                                   {`${t('discount')}: ${Formater(
//                                     data.ticket_price *
//                                       counter.reduction *
//                                       counter.value,
//                                     router.locale,
//                                   )}`}
//                                 </p>
//                               )}
//                               <span>
//                                 {Formater(
//                                   counter.value * data.ticket_price -
//                                     counter.value *
//                                       data.ticket_price *
//                                       counter.reduction,
//                                   router.locale,
//                                 )}
//                               </span>
//                             </div>
//                             <button
//                               onClick={() => {
//                                 typeof window !== 'undefined' &&
//                                   window.scrollTo(0, 0);
//                                 setRedirecting(true);
//                                 competitions.length > 0
//                                   ? competitions.filter((comp) =>
//                                       comp.compID === data.id
//                                         ? updateComp({
//                                             reduction: counter.reduction,
//                                             compID: data.id,
//                                             number_tickets:
//                                               counter.value +
//                                               comp.number_tickets,
//                                             price_per_ticket: data.ticket_price,
//                                           })
//                                         : addComp({
//                                             reduction: counter.reduction,
//                                             compID: data.id,
//                                             number_tickets: counter.value,
//                                             price_per_ticket: data.ticket_price,
//                                           }),
//                                     )
//                                   : addComp({
//                                       reduction: counter.reduction,
//                                       compID: data.id,
//                                       number_tickets: counter.value,
//                                       price_per_ticket: data.ticket_price,
//                                     });
//                                 void router.push('/Cart');
//                               }}
//                             >
//                               {t('continue')}
//                             </button>
//                           </div>
//                         )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className={styles.compDesc}>
//               <div className={styles.compDet}>
//                 <h1>{t('details')}</h1>
//                 <div className={styles.compDetails}>
//                   <p>
//                     {`${t('prize')} ${data.Watches.brand} ${
//                       data.Watches.model
//                     } ${data.Watches.reference_number} - ${t('paperwork')}`}
//                   </p>
//                   {data.total_tickets > 0 && (
//                     <p>
//                       {t('maxspace')} {data.total_tickets}
//                     </p>
//                   )}
//                   <p>{`${t('maxwatchwinner')} ${data.max_watch_number}`}</p>
//                   <p>
//                     {t('endcomp')} {DateFormater(data.end_date, router.locale)}{' '}
//                     {t('timezone')}
//                   </p>

//                   <p>
//                     {`${t('winannon')} ${DateFormater(
//                       data.drawing_date,
//                       router.locale,
//                     )} ${t('liveinsta')} `}
//                     <a
//                       className={styles.instaLink}
//                       href='https://www.instagram.com/winuwatch/'
//                     >
//                       @winuwatch
//                     </a>
//                     {' ' + t('timezone')}
//                   </p>

//                   <p>
//                     {t('runup')} 4 {t('willwin')}{' '}
//                     {Formater(parseFloat(data.run_up_prize || '0'))}{' '}
//                     {t('creditto')}
//                   </p>
//                 </div>
//               </div>
//               <div className={styles.compDet}>
//                 <h1>{t('watchinfo')}</h1>
//                 <div className={styles.watchInfo}>
//                   <div className={styles.left}>
//                     {[
//                       {
//                         item: 'Brand',
//                         translation: t('brand'),
//                         value: data.Watches.brand,
//                       },
//                       {
//                         item: 'Model',
//                         translation: t('model'),
//                         value: data.Watches.model,
//                       },
//                       {
//                         item: 'Reference number',
//                         translation: t('refnumber'),
//                         value: data.Watches.reference_number,
//                       },
//                       {
//                         item: 'Movement',
//                         translation: t('mov'),
//                         value: data.Watches.movement,
//                       },
//                     ].map(
//                       ({ item, value, translation }, i) =>
//                         data.Watches && (
//                           <span
//                             style={{
//                               flexDirection:
//                                 router.locale === 'il' ? 'row-reverse' : 'row',
//                             }}
//                             key={i}
//                           >
//                             <b>{translation}</b>
//                             <p
//                               style={{
//                                 textDecoration:
//                                   item === 'Brand' ||
//                                   item === 'Model' ||
//                                   item === 'Reference number'
//                                     ? 'underline'
//                                     : 'none',
//                               }}
//                             >
//                               {value}
//                             </p>
//                           </span>
//                         ),
//                     )}
//                   </div>
//                   <div className={styles.left}>
//                     {[
//                       {
//                         item: t('ymanifacture'),
//                         value: data.Watches.year_of_manifacture,
//                       },
//                       {
//                         item: t('calibregear'),
//                         value: data.Watches.caliber_grear,
//                       },
//                       {
//                         item: t('glass'),
//                         value: data.Watches.glass,
//                       },
//                       {
//                         item: t('bezelmeterial'),
//                         value: data.Watches.bezel_material,
//                       },
//                       {
//                         item: t('bracematerial'),
//                         value: data.Watches.Bracelet_material,
//                       },
//                     ].map(
//                       ({ item, value }, i) =>
//                         data.Watches &&
//                         data.Watches !== null && (
//                           <span
//                             style={{
//                               flexDirection:
//                                 router.locale === 'il' ? 'row-reverse' : 'row',
//                             }}
//                             key={i}
//                           >
//                             <b>{item}</b>
//                             <p>{value}</p>
//                           </span>
//                         ),
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )
//       )}

//       <Footer />
//     </div>
//   );
// }
