// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable  @typescript-eslint/restrict-template-expressions */
// import CheckoutComp from '@/components/CheckoutComp';
// import Footer from '@/components/Footer';
// import NavBar from '@/components/NavBar';
// import Head from 'next/head';
// import type { GetStaticPropsContext } from 'next';
// import { useRouter } from 'next/router';
// export default function CheckoutPage() {
//   const router = useRouter();
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
//       <CheckoutComp />
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
