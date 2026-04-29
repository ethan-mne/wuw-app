// import DashboardComp from '@/components/dashboard/DashboardComp';
// import styles from '@/styles/Dashboard.module.css';
// import DashboardMainNav from '@/components/dashboard/DashboardMainNav';
// import { useStore as UseStore, useCart } from '@/components/Store';
// import DashboardNav from '@/components/dashboard/DashboardNav';
// import DashboardCompetitions from '@/components/dashboard/DashboardCompetitions';
// import DashboardWatches from '@/components/dashboard/DashboardWatches';
// import DashboardOrders from '@/components/dashboard/DashboardOrders';
// import DashboardWinners from '@/components/dashboard/DashboardWinners';
// import DashboardAffiliation from '@/components/dashboard/DashboardAffiliation';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import Head from 'next/head';
// import { Button, Modal } from 'react-bootstrap';
// import { useEffect, useState } from 'react';
// import Form from 'react-bootstrap/Form';
// import Row from 'react-bootstrap/Row';
// import * as Yup from 'yup';
// import { Formik } from 'formik';
// import Image from 'next/image';
// import { api } from '@/utils/api';
// import DashboardNewsLetters from '@/components/dashboard/DashboardNewsLetters';
// import DashboardFreeTickets from '@/components/dashboard/DashboardFreeTickets';

// export function ModalCheck() {
//   const { auth: authen, setAuth } = useCart();
//   const [show, setShow] = useState(authen === true ? false : true);
//   const [error, setError] = useState('');
//   const { mutateAsync: auth, data } = api.DashAuth.auth.useMutation();

//   useEffect(() => {
//     // if (
//     //   authDate !== null
//     //     ? new Date().getTime() - new Date(authDate).getTime() < 10800000
//     //     : false
//     // ) {
//     //   setAuthDate(new Date());
//     // } else {
//     //   setShow(true);
//     //   setAuthDate(null);
//     // }

//     if (data === true) {
//       setShow(false);
//       setAuth(true);
//     }
//     if (data === false) {
//       setError('Wrong password or username');
//     }
//   }, [data, authen, setAuth]);
//   const SignupSchema = Yup.object().shape({
//     username: Yup.string().required('Required'),
//     password: Yup.string().required('Required'),
//   });
//   return (
//     <Modal
//       className='dash-modal'
//       show={show}
//       backdrop='static'
//       keyboard={false}
//       style={{ backgroundColor: 'white' }}
//     >
//       <Modal.Header>
//         <Modal.Title
//           style={{
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             justifyContent: 'center',
//             gap: '1rem',
//             width: '100%',
//           }}
//         >
//           <Image src='/images/logo.png' width={150} height={100} alt='logo' />
//           <h2
//             style={{
//               margin: '0',
//               marginTop: '-30px',
//               fontFamily: 'Iskry, sans-serif',
//               textTransform: 'uppercase',
//             }}
//           >
//             Admin Dashboard
//           </h2>
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body
//         style={{
//           display: 'grid',
//           placeItems: 'center',
//         }}
//       >
//         <div
//           style={{
//             width: '90%',
//             height: '40vh',
//             margin: '20px 0px',
//           }}
//         >
//           <Formik
//             initialValues={{
//               username: '',
//               password: '',
//             }}
//             validationSchema={SignupSchema}
//             onSubmit={async (values) => {
//               // same shape as initial values
//               await auth({
//                 username: values.username,
//                 password: values.password,
//               });

//               console.log(values);
//             }}
//           >
//             {({ errors, touched, handleSubmit, handleChange }) => (
//               <Form onSubmit={handleSubmit}>
//                 <Row>
//                   <Form.Group className='mb-3'>
//                     <Form.Label>User Name</Form.Label>
//                     <Form.Control
//                       required
//                       name='username'
//                       onChange={handleChange}
//                       placeholder='User Name'
//                     />
//                   </Form.Group>
//                 </Row>
//                 {errors.username && touched.username ? (
//                   <div style={{ color: 'red' }}>{errors.username}</div>
//                 ) : null}
//                 <Row className='mb-3'>
//                   <Form.Group className='mb-3'>
//                     <Form.Label>Password</Form.Label>
//                     <Form.Control
//                       required
//                       type='password'
//                       name='password'
//                       onChange={handleChange}
//                       placeholder='Password'
//                     />
//                   </Form.Group>
//                 </Row>
//                 {errors.password && touched.password ? (
//                   <div style={{ color: 'red' }}>{errors.password}</div>
//                 ) : null}
//                 <Row
//                   style={{ display: 'grid', placeItems: 'center' }}
//                   className='mb-3'
//                 >
//                   {error && <p style={{ color: 'red' }}>{error}</p>}
//                   <Button
//                     style={{
//                       width: '95%',
//                       backgroundColor: '#a8957e',
//                       borderColor: '#a8957e',
//                     }}
//                     type='submit'
//                   >
//                     Submit
//                   </Button>
//                 </Row>
//               </Form>
//             )}
//           </Formik>
//         </div>
//       </Modal.Body>
//     </Modal>
//   );
// }

// const index = () => {
//   const { menu } = UseStore();

//   return (
//     <div className={styles.MainCon}>
//       <Head>
//         <title>Win u Watch - Dashboard</title>
//         <meta name='viewport' content='width=device-width, initial-scale=1' />
//         <link rel='icon' href='/favicon.ico' />
//       </Head>
//       <DashboardMainNav />
//       <div className={styles.dashBody}>
//         <DashboardNav />
//         <div className={styles.Body}>
//           {menu === 'Dashboard' ? (
//             <DashboardComp />
//           ) : menu === 'Competitions' ? (
//             <DashboardCompetitions />
//           ) : menu === 'Watches' ? (
//             <DashboardWatches />
//           ) : menu === 'Orders' ? (
//             <DashboardOrders />
//           ) : menu === 'Winners' ? (
//             <DashboardWinners />
//           ) : menu === 'Communication' ? (
//             <DashboardNewsLetters />
//           ) : menu === 'Affiliations' ? (
//             <DashboardAffiliation />
//           ) : menu === 'Free Tickets' ? (
//             <DashboardFreeTickets />
//           ) : (
//             <h1>Competitions</h1>
//           )}
//         </div>
//       </div>
//       <ModalCheck />
//     </div>
//   );
// };

// export default index;
