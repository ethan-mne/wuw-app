// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable  @typescript-eslint/restrict-template-expressions */
// import Charit from '@/components/Charit';
// import Footer from '@/components/Footer';
// import NavBar from '@/components/NavBar';
// import Head from 'next/head';
// import type { GetStaticPropsContext } from 'next';
// import { useRouter } from 'next/router';

// export default function Charity() {
//   const router = useRouter();
//   return (
//     <div
//       style={{
//         textAlign: router.locale === 'il' ? 'right' : 'left',
//       }}
//     >
//       <Head>
//         <title>Win u Watch - Charity</title>
//         <meta name='description' content='Win u Watch Our Charity' />
//         <meta name='viewport' content='width=device-width, initial-scale=1' />
//         <link rel='icon' href='/favicon.ico' />
//       </Head>
//       <NavBar />
//       <Charit />
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
