// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable  @typescript-eslint/restrict-template-expressions */
// import Footer from '@/components/Footer';
// import NavBar from '@/components/NavBar';
// import Head from 'next/head';
// import styles from '@/styles/Philosophy.module.css';
// import { Fade } from '@mui/material';
// import { useTranslations } from 'next-intl';
// import type { GetStaticPropsContext } from 'next';
// import { useRouter } from 'next/router';
// export default function Philosopht() {
//   const router = useRouter();
//   const t = useTranslations('philosophy');
//   return (
//     <div
//       style={{
//         textAlign: router.locale === 'il' ? 'right' : 'left',
//       }}
//     >
//       <Head>
//         <title>Win u Watch - Philosophy</title>
//         <meta name='description' content='Win u Watch Our Philosophy' />
//         <meta name='viewport' content='width=device-width, initial-scale=1' />
//         <link rel='icon' href='/favicon.ico' />
//       </Head>
//       <NavBar />
//       <div className={styles.philoMain}>
//         <div
//           style={{
//             background:
//               router.locale === 'en'
//                 ? 'linear-gradient( 180deg, #faf8f6 30%, rgba(206, 198, 189, 0) 35.83%, #a8957e 80% )'
//                 : 'linear-gradient( 180deg, #faf8f6 30%, rgba(206, 198, 189, 0) 50.83%, #a8957e 100% )',
//           }}
//           className={styles.Philo}
//         >
//           <Fade in={true}>
//             <div className={styles.philoHeader}>
//               <h1>{t('philoheader')}</h1>
//               <p>{t('philoheaderdesc')}</p>
//             </div>
//           </Fade>
//           <div className={styles.philoBotTxt}>
//             <h1>{t('philotext')}</h1>
//             <p>{t('philotextdesc')}</p>
//           </div>
//         </div>
//         <div className={styles.philoImg}></div>
//       </div>
//       <Footer />
//     </div>
//   );
// }

// export async function getStaticProps({ locale }: GetStaticPropsContext) {
//   return {
//     props: {
//       messages: (await import(`../../messages/${locale}.json`)).default,
//     },
//   };
// }
