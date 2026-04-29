'use client';

import DashboardComp from './DashboardComp';
import styles from '@/styles/Dashboard.module.css';
import DashboardMainNav from './DashboardMainNav';
import { useStore } from './Store';

import DashboardCompetitions from './DashboardCompetitions';
import DashboardWatches from './DashboardWatches';
import DashboardOrders from './DashboardOrders';
import DashboardWinners from './DashboardWinners';
import DashboardAffiliation from './DashboardAffiliation';
import 'bootstrap/dist/css/bootstrap.min.css';
import Head from 'next/head';
import DashboardNewsLetters from './DashboardNewsLetters';
import DashboardFreeTickets from './DashboardFreeTickets';

export function Dashboard() {
  const { menu } = useStore();

  return (
    <div className={styles.MainCon}>
      <Head>
        <title>Win u Watch - Dashboard</title>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <DashboardMainNav />
      <div className={styles.dashBody}>

        <div className={styles.Body}>
          {menu === 'Dashboard' ? (
            <DashboardComp />
          ) : menu === 'Competitions' ? (
            <DashboardCompetitions />
          ) : menu === 'Watches' ? (
            <DashboardWatches />
          ) : menu === 'Orders' ? (
            <DashboardOrders />
          ) : menu === 'Winners' ? (
            <DashboardWinners />
          ) : menu === 'Communication' ? (
            <DashboardNewsLetters />
          ) : menu === 'Affiliations' ? (
            <DashboardAffiliation />
          ) : menu === 'Free Tickets' ? (
            <DashboardFreeTickets />
          ) : (
            <h1>Competitions</h1>
          )}
        </div>
      </div>
      {/* <ModalCheck /> */}
    </div>
  );
}
