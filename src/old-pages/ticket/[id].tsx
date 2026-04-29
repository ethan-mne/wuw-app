// import Head from 'next/head';
// import { api } from '@/utils/api';
// import styles from '@/styles/Ticket.module.css';
// import { z } from 'zod';
// import QRCode from 'react-qr-code';

// import type {
//   GetServerSidePropsContext,
//   InferGetServerSidePropsType,
// } from 'next';
// import Image from 'next/image';

// export default function Confirmation({
//   id,
// }: InferGetServerSidePropsType<typeof getServerSideProps>) {
//   const { data } = api.Tickets.getTicket.useQuery(id);

//   return (
//     <div>
//       <Head>
//         <title>Order Complete</title>
//         <meta name='viewport' content='width=device-width, initial-scale=1' />
//         <link rel='icon' href='/favicon.ico' />
//       </Head>

//       <div className={styles.confirmwrapper}>
//         {data && (
//           <div className={styles.wrapper}>
//             <h1>Your Ticket Code : {data.id}</h1>

//             <div className={styles.head}>
//               <header>
//                 <p>Details</p>
//                 <p>Order {data.Order.id} </p>
//               </header>
//               <div className={styles.comp_info}>
//                 <h6>{data.Competition.name}</h6>
//               </div>
//               <header>
//                 <p>Value of this ticket</p>
//                 <p> £ {data.Competition.ticket_price} </p>
//               </header>
//             </div>

//             <div className={styles.qrcode}>
//               <QRCode
//                 size={50}
//                 style={{ height: 'auto', maxWidth: '40%', width: '40%' }}
//                 value={data.id}
//                 viewBox={`0 0 50 50`}
//               />
//             </div>

//             <footer>
//               <h6>WITH THE Randomdraws&apos;S CERTIFICATION</h6>
//               <Image
//                 style={{
//                   marginTop: '15px',
//                   height: 'auto',
//                   maxWidth: '200px',
//                   // maxWidth: "60%",
//                 }}
//                 src='/images/certigame_logo.png'
//                 alt='certigame'
//                 width={200}
//                 height={200}
//               />
//               <p>www.winuwatch.uk</p>
//             </footer>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
// export const getServerSideProps = (context: GetServerSidePropsContext) => {
//   const { id } = context.query;
//   return {
//     props: {
//       id: z.string().parse(id),
//     },
//   };
// };
