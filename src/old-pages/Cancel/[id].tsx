// import Footer from '@/components/Footer';
// import NavBar from '@/components/NavBar';
// import Head from 'next/head';
// import { api } from '@/utils/api';
// import { z } from 'zod';
// import type {
//   GetServerSidePropsContext,
//   InferGetServerSidePropsType,
// } from 'next';
// import { useTranslations } from 'next-intl';
// import styles from '@/styles/Cancel.module.css';
// import { useEffect } from 'react';
// // import Loader from '@/components/Loader';
// import { useRouter } from 'next/router';
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

// export default function Cancel({
//   id,
// }: InferGetServerSidePropsType<typeof getServerSideProps>) {
//   const router = useRouter();
//   const { mutateAsync: update } = api.Order.updateStatus.useMutation({});
//   const { mutateAsync: RemoveTickets } = api.Order.removeTickets.useMutation(
//     {},
//   );
//   const t = useTranslations('thanku');
//   useEffect(() => {
//     void (async () => {
//       await update({
//         id: id,
//         status: 'CANCELLED',
//       });
//       await RemoveTickets(id);
//       await router.push('/Cart');
//     })();
//   }, [id, update, RemoveTickets, router]);

//   return (
//     <div
//       style={{
//         textAlign: router.locale === 'il' ? 'right' : 'left',
//       }}
//     >
//       <Head>
//         <title>Order Complete</title>
//         <meta name='viewport' content='width=device-width, initial-scale=1' />
//         <link rel='icon' href='/favicon.ico' />
//       </Head>
//       <NavBar />
//       <div className={styles.CancelWrap}>
//         <h1>{t('cancelled')}</h1>
//         <div className={styles.loader}>
//           <p>{t('redirected')}</p>
//           <Loader />
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );
// }
