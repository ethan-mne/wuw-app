/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
'use client';

import { api } from '@/trpc/react';
import { Avatar, Fab, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconArrowDownRight,
  IconArrowUpLeft,
  IconCurrencyPound,
} from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import React from 'react';
import DashboardCard from './DashboardCard';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const MonthlyEarnings = () => {
  const { data: dataObj } = api.Charts.ticketSoldPerDay.useQuery();

  // chart color
  const theme = useTheme();
  const secondary = 'rgba(168, 149, 126, 0.7)';
  const secondarylight = 'rgba(168, 149, 126, 0.1)';
  const successlight = 'rgba(3, 201, 169, 0.2)';
  return (
    <DashboardCard
      title='Monthly Sold Tickets'
      action={
        <Fab
          color='secondary'
          size='medium'
          sx={{ color: '#ffffff', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <IconCurrencyPound width={24} />
        </Fab>
      }
      footer={
        <Chart
          options={{
            chart: {
              type: 'area',
              fontFamily: "'Plus Jakarta Sans', sans-serif;",
              foreColor: 'rgba(168, 149, 126, 0.3)',
              toolbar: {
                show: false,
              },
              height: 60,
              sparkline: {
                enabled: true,
              },
              group: 'sparklines',
            },
            stroke: {
              curve: 'smooth',
              width: 2,
            },
            fill: {
              colors: ['#fff'],
              type: 'solid',
              opacity: 0.05,
            },
            markers: {
              size: 0,
            },
            tooltip: {
              theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
            },
          }}
          series={[
            {
              name: 'Total Tickets',
              color: secondary,
              data: dataObj?.data.map((item) => item.total_tickets) ?? [],
            },
          ]}
          type='area'
          height='60px'
        />
      }
    >
      <>
        <Typography variant='h3' fontWeight='700' mt='-20px'>
          {dataObj?.totalTicketsThisMonth ?? 0}
        </Typography>
        <Stack direction='row' spacing={1} my={1} alignItems='center'>
          {!!dataObj &&
          dataObj?.totalTicketsThisMonth > dataObj?.totalTicketsLastMonth ? (
            <Avatar sx={{ bgcolor: successlight, width: 27, height: 27 }}>
              <IconArrowUpLeft width={20} color='#39B69A' />
            </Avatar>
          ) : (
            <Avatar sx={{ bgcolor: secondarylight, width: 27, height: 27 }}>
              <IconArrowDownRight width={20} color={secondary} />
            </Avatar>
          )}
          <Typography variant='subtitle2' fontWeight='600'>
            {!dataObj?.totalTicketsLastMonth
              ? 100
              : (dataObj?.totalTicketsThisMonth ?? 0) -
                ((dataObj?.totalTicketsLastMonth ?? 0) /
                  (dataObj?.totalTicketsLastMonth ?? 1)) *
                  100}
            %{' '}
          </Typography>
          <Typography variant='subtitle2' color='textSecondary'>
            Last Month
          </Typography>
        </Stack>
      </>
    </DashboardCard>
  );
};

export default MonthlyEarnings;
