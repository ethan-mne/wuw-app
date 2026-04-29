'use client';

import DashboardCard from './DashboardCard';
import { api } from '@/trpc/react';
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';

const PAYMENT_COLORS = {
  STRIPE: '#635BFF',
  VOUCH_LAB: '#00B0FF',
  TWELVE: '#1A9A7A',
} as const;

const PaymentSplits = () => {
  const { data, isLoading } = api.Charts.getStripePaymentSplits.useQuery(7, {
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  return (
    <DashboardCard
      title='Payment Splits'
      subtitle={`Last ${data?.periodDays ?? 7} days`}
      action={<Chip size='small' label={`Total ${data?.total ?? 0}`} />}
    >
      <Stack spacing={2}>
        {(data?.split ?? []).map((item) => (
          <Box key={item.paymentMethod}>
            <Stack direction='row' justifyContent='space-between' mb={0.5}>
              <Typography variant='subtitle2'>{item.label}</Typography>
              <Typography variant='subtitle2' color='textSecondary'>
                {item.count} ({item.percentage}%)
              </Typography>
            </Stack>
            <LinearProgress
              variant='determinate'
              value={item.percentage}
              sx={{
                height: 8,
                borderRadius: 8,
                backgroundColor: 'rgba(0,0,0,0.08)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: PAYMENT_COLORS[item.paymentMethod],
                },
              }}
            />
          </Box>
        ))}
        {!isLoading && (data?.total ?? 0) === 0 && (
          <Typography variant='subtitle2' color='textSecondary'>
            No Stripe gateway payments found in this period.
          </Typography>
        )}
      </Stack>
    </DashboardCard>
  );
};

export default PaymentSplits;
