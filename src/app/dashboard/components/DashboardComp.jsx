'use client';

import { Grid } from '@mui/material';
import SalesOverview from './/SalesOverview';
import YearlyBreakup from './/YearlyBreakup';
import OrderPerformance from './/OrderPerformance';
import MonthlyEarnings from './/MonthlyEarnings';
import PaymentSplits from './/PaymentSplits';
import Box from '@mui/material/Box';

const DashboardComp = () => {
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} lg={7.7}>
          <SalesOverview />
        </Grid>
        <Grid item xs={12} lg={4.3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <YearlyBreakup />
            </Grid>
            <Grid item xs={12}>
              <MonthlyEarnings />
            </Grid>
            <Grid item xs={12}>
              <PaymentSplits />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} lg={12}>
          <OrderPerformance />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardComp;
