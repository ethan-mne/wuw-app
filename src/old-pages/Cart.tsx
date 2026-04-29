// import CartComp from '@/components/CartComp';
// import Footer from '@/components/Footer';
// import NavBar from '@/components/NavBar';
// import Head from 'next/head';
// import styles from '@/styles/Cart.module.css';
// import type { GetStaticPropsContext } from 'next';
// import { useRouter } from 'next/router';

// export default function Cart() {
//   const router = useRouter();

//   return (
//     <div
//       style={{
//         textAlign: router.locale === 'il' ? 'right' : 'left',
//       }}
//       className={styles.CartPageWrapper}
//     >
//       <Head>
//         <title>Win u Watch - Cart</title>
//         <meta name='description' content='Win u Watch Cart' />
//         <meta name='viewport' content='width=device-width, initial-scale=1' />
//         <link rel='icon' href='/favicon.ico' />
//       </Head>
//       <NavBar />
//       <div className={styles.CartWrapper}>
//         <CartComp />
//       </div>
//       <Footer />
//     </div>
//   );
// }

// export async function getStaticProps({ locale }: GetStaticPropsContext) {
//   return {
//     props: {
//       //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions
//       messages: (await import(`../../messages/${locale}.json`)).default,
//     },
//   };
// }
