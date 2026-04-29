// 'use client';

// import React, { useEffect } from 'react';
// import styles from '../styles/Home.module.css';
// import '@splidejs/react-splide/css';
// import { Splide, SplideSlide } from '@splidejs/react-splide';
// import { Formater } from '@/utils';
// import Image from 'next/image';
// import { useTranslations } from 'next-intl';

// const OurWinner = () => {
//   const AmountGiven = 476_000;
//   const data = [
//     {
//       img: '/images/winner/batman_winner.jfif',
//       name: 'Johan',
//       country: 'France',
//       watch: 'Rolex Batman',
//     },
//     {
//       img: '/images/winner/pepsi_winner.jfif',
//       name: `David`,
//       country: 'France',
//       watch: 'Rolex Pepsi',
//     },
//     {
//       img: '/images/winner/daytona_winner.jfif',
//       name: 'Avraham',
//       country: 'USA',
//       watch: 'Rolex Daytona',
//     },
//     {
//       img: '/images/winner/patek_winner.jfif',
//       name: 'Amiel',
//       country: 'Spain',
//       watch: 'Patek Philippe Aquanaut',
//     },
//     {
//       img: '/images/winner/sprite_winner.jpeg',
//       name: 'Jonathan A.',
//       country: 'France',
//       watch: 'Rolex Sprite',
//     },
//     {
//       img: '/images/winner/rolex_gmt_master.jpeg',
//       name: 'Marguarita C.',
//       country: 'Spain',
//       watch: 'ROLEX GMT MASTER ROOT BEER',
//     },
//     {
//       img: '/images/winner/daytona_winner.jpg',
//       name: 'Yoni levy',
//       country: 'France',
//       watch: 'Rolex Daytona Oyster',
//     },
//     {
//       img: '/images/winner/daytona_winner_2.jfif',
//       name: 'Johanna Feder',
//       country: 'USA',
//       watch: ' Rolex Daytona Oysterflex',
//     },
//     {
//       img: '/images/winner/patek_philippe_aquanaut_winner.jpg',
//       name: 'Kelly Sebag Badash',
//       country: 'Israel',
//       watch: 'Patek Philippe Aquanaut',
//     },
//     {
//       img: '/images/winner/rolex_batman_winner.jpg',
//       name: 'Michael Adda',
//       country: 'France',
//       watch: 'Rolex Batman',
//     },
//     {
//       img: '/images/winner/rolex_pepsi_winner.jpg',
//       name: 'David Naim',
//       country: 'France',
//       watch: 'Rolex Pepsi',
//     },
//     {
//       img: '/images/winner/rolex_sprite_winner.jpg',
//       name: 'David Danan',
//       country: 'France',
//       watch: 'Rolex Sprite',
//     },
//   ].reverse();
//   const t = useTranslations('winners');
//   useEffect(() => {
//     const handleScroll = () => {
//       const background = document.querySelector(
//         `.${styles.background7 ?? 'undefined'}`,
//       ) as HTMLElement & { style: CSSStyleDeclaration };
//       if (background) {
//         background.style.backgroundPositionY =
//           window.scrollY === 0 ? '-124px' : `${-window.scrollY}px`;
//       }
//     };
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   return (
//     <div className={styles.WinnCon}>
//       <h1
//         className={styles.background7}
//         style={{
//           textAlign: 'center',
//           padding: '0',
//           textTransform: 'uppercase',
//         }}
//       >
//         {t('title')}
//       </h1>
//       <h1
//         style={{
//           paddingTop: '20px',
//           textAlign: 'center',
//           fontSize: '1.5rem',
//           color: '#000000',
//           fontFamily: 'Iskry ,sans-serif',
//         }}
//         className={styles.background7}
//       >
//         {t('subtitle')}
//       </h1>
//       <div className={styles.winnerCarou}>
//         <p className={styles.activeDesc}>
//           {t('desc1')} <span>{Formater(AmountGiven)}</span> {t('desc2')}
//         </p>
//         <div className={styles.splide}>
//           <Splide
//             options={{
//               type: 'loop', //              type: "none",
//               isNavigation: true,
//               drag: false,
//               cloneStatus: false,
//               arrows: false,
//               pagination: false,
//               perPage: 3,
//               padding: '5rem', //              padding: "18rem",
//               classes: {
//                 arrows: 'splideArr',
//               },
//               breakpoints: {
//                 931: {
//                   perPage: 2,
//                   padding: '10rem',
//                 },
//                 1281: {
//                   perPage: 2,
//                   padding: '10rem',
//                 },
//                 1345: {
//                   perPage: 2,
//                   padding: '20rem',
//                 },
//               },
//             }}
//             aria-label='My Favorite Images'
//           >
//             {data.map((item, i) => (
//               <SplideSlide
//                 // className={i === 2 ? "splide__slide--clone" : ""}

//                 key={i}
//               >
//                 <div
//                   style={{
//                     transition: 'all 0.3s ease',
//                   }}
//                   className={styles.carouItem}
//                 >
//                   <div className='carouImgCon'>
//                     <Image
//                       className={styles.active}
//                       src={item.img}
//                       alt='rec'
//                       width={300}
//                       height={300}
//                     />
//                   </div>
//                   <div
//                     style={{
//                       transition: 'all 0.3s ease',
//                       display: 'flex',
//                       flexDirection: 'column',
//                       alignItems: 'center',
//                       gap: '0.5rem',
//                       // opacity: i === 0 ? 1 : i === 1 ? 1 : i === 2 ? 0 : 0,
//                     }}
//                     className='activeName'
//                   >
//                     {/* <p>{t("nameOfWinner")}</p> */}
//                     <p
//                       style={{
//                         margin: '0',
//                         textAlign: 'center',
//                       }}
//                     >
//                       Winner of the
//                       <br />
//                       <b
//                         style={{
//                           fontWeight: '400',
//                           fontFamily: 'Iskry ,sans-serif',
//                           textTransform: 'uppercase',
//                         }}
//                       >
//                         {item.watch}
//                       </b>
//                     </p>
//                     <hr
//                       style={{
//                         width: '30%',
//                         height: '2px',
//                         backgroundColor: ' #e4dad3',
//                         border: 'none',
//                       }}
//                     />
//                     <h2>{item.name}</h2>
//                     <span style={{ textAlign: 'center' }}>
//                       {item.country.toUpperCase()}
//                     </span>
//                   </div>

//                   <div style={{ opacity: 0 }}>
//                     <p
//                       style={{
//                         margin: '0',
//                         textAlign: 'center',
//                       }}
//                     >
//                       Winner of the
//                       <br />
//                       <b
//                         style={{
//                           fontWeight: '400',
//                           fontFamily: 'Iskry ,sans-serif',
//                           textTransform: 'uppercase',
//                         }}
//                       >
//                         {item.watch}
//                       </b>
//                     </p>
//                     <hr
//                       style={{
//                         width: '30%',
//                         height: '2px',
//                         backgroundColor: ' #e4dad3',
//                         border: 'none',
//                       }}
//                     />
//                     <h2>{item.name}</h2>
//                     <span style={{ textAlign: 'center' }}>
//                       {item.country.toUpperCase()}
//                     </span>
//                   </div>
//                 </div>
//               </SplideSlide>
//             ))}
//           </Splide>
//         </div>
//       </div>
//       <div className={styles.AliceCarou}>
//         <p className={styles.activeDesc}>
//           {t('desc1')} <span>{Formater(AmountGiven)}</span> {t('desc2')}
//         </p>
//         <Splide
//           options={{
//             rewind: false,
//             type: 'loop',
//             mediaQuery: 'max',
//             breakpoints: {
//               320: {
//                 padding: '0rem',
//                 perPage: 1,
//               },
//               375: {
//                 padding: '2rem',
//               },
//               393: {
//                 padding: '2rem',
//               },

//               425: {
//                 padding: '3rem',
//                 perPage: 1,
//               },
//               428: {
//                 padding: '4rem',
//                 perPage: 1,
//               },
//               500: {
//                 padding: '6rem',
//                 perPage: 1,
//               },
//               768: {
//                 padding: '0rem',
//                 perPage: 2,
//               },
//             },
//             autoplay: false,
//             arrows: false,
//             pagination: false,
//             drag: true,
//           }}
//           aria-label='My Favorite Images'
//         >
//           {data.map((item, i) => (
//             <SplideSlide key={i}>
//               <div
//                 style={{
//                   transition: 'all 1s ease',
//                 }}
//                 className={styles.carouItem}
//               >
//                 <Image
//                   className={styles.active}
//                   src={item.img}
//                   alt='rec'
//                   width={200}
//                   height={200}
//                 />

//                 <div
//                   style={{
//                     transition: 'all 1s ease',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center',
//                     gap: '0.5rem',
//                   }}
//                   className='activeName'
//                 >
//                   <p
//                     style={{
//                       margin: '0',
//                       textAlign: 'center',
//                     }}
//                   >
//                     Winner of the
//                     <br />
//                     <b
//                       style={{
//                         fontWeight: '400',
//                         fontFamily: 'Iskry ,sans-serif',
//                         textTransform: 'uppercase',
//                       }}
//                     >
//                       {item.watch}
//                     </b>
//                   </p>
//                   <hr
//                     style={{
//                       width: '30%',
//                       height: '2px',
//                       backgroundColor: ' #e4dad3',
//                       border: 'none',
//                     }}
//                   />
//                   <h2>{item.name}</h2>
//                   <span style={{ textAlign: 'center' }}>
//                     {item.country.toUpperCase()}
//                   </span>
//                 </div>
//               </div>
//             </SplideSlide>
//           ))}
//         </Splide>
//       </div>
//     </div>
//   );
// };

// export default OurWinner;
