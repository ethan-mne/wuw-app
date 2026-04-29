'use client';

import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import DashboardCard from './DashboardCard';
import { api } from '@/trpc/react';
import { formatPhoneNumberIntl } from 'react-phone-number-input';
import type { E164Number } from 'libphonenumber-js';
import { toast } from 'sonner';

export const formatPhoneNumberSafely = (
  phone: string | null | undefined,
): string => {
  if (!phone) return '';
  try {
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    return formatPhoneNumberIntl(phoneWithPlus as E164Number) || phoneWithPlus;
  } catch (error) {
    return phone;
  }
};

const PREFERRED_UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
] as const;

const parseUtmDetails = (rawUtm: string | null | undefined) => {
  if (!rawUtm) {
    return {
      hasUtm: false,
      entries: [] as Array<[string, string]>,
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawUtm);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        hasUtm: false,
        entries: [] as Array<[string, string]>,
      };
    }

    const asRecord = parsed as Record<string, unknown>;
    const normalized: Array<[string, string]> = [];

    for (const key of PREFERRED_UTM_KEYS) {
      const value = asRecord[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        normalized.push([key, value.trim()]);
      }
    }

    for (const [key, value] of Object.entries(asRecord)) {
      if (
        key.startsWith('utm_') &&
        typeof value === 'string' &&
        value.trim().length > 0 &&
        !normalized.some(([existingKey]) => existingKey === key)
      ) {
        normalized.push([key, value.trim()]);
      }
    }

    return {
      hasUtm: normalized.length > 0,
      entries: normalized,
    };
  } catch {
    return {
      hasUtm: false,
      entries: [] as Array<[string, string]>,
    };
  }
};

const OrderPerformance = () => {
  const STATUS_COLORS = {
    CONFIRMED: '#00B87C', // green
    PENDING: '#00B0FF', // blue
    ATTEMPTED: '#9E9E9E', // gray
    CANCELLED: '#FF9800', // orange
    REFUNDED: '#FF5252', // red
    INCOMPLETE: '#9E9E9E', // gray
  } as const;

  const PAYMENT_METHOD_COLORS = {
    WORLDCARD: '#00B0FF', // blue
    STRIPE: '#635BFF', // stripe purple
    PAYPAL: '#003087', // paypal blue
    WINCOIN: '#00B87C', // green
    AUREAVIA: '#FF6B6B', // coral red
    AFFILIATION: '#4CAF50', // green
    MARKETING: '#9C27B0', // purple
    VOUCH_LAB: '#00B0FF', // blue
    TWELVE: '#1A9A7A', // green teal
    DEFAULT: '#5B33FF', // fallback purple
  } as const;

  const {
    data: orders,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = api.Charts.getLastOrders.useQuery(100, {
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
  });

  const { mutateAsync: confirmPayment, isLoading } =
    api.payments.confirmPayment.useMutation({
      onSettled: async () => {
        toast.success('Payment confirmed');
        await refetch();
      },
      onError: () => {
        toast.error('Error confirming payment');
      },
    });

  return (
    <DashboardCard
      title={`Last Orders updated at ${new Date(dataUpdatedAt).toLocaleString()}`}
      action={
        <IconButton
          onClick={() => refetch()}
          color='primary'
          size='small'
          disabled={isRefetching}
        >
          Refresh
        </IconButton>
      }
    >
      <Box sx={{ overflow: 'auto', width: { xs: '280px', sm: 'auto' } }}>
        <Table
          aria-label='simple table'
          sx={{
            whiteSpace: 'nowrap',
            mt: 2,
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant='subtitle2' fontWeight={600}>
                  #
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant='subtitle2' fontWeight={600}>
                  Client
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant='subtitle2' fontWeight={300}>
                  Num Tickets
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant='subtitle2' fontWeight={600}>
                  Payment Method
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant='subtitle2' fontWeight={600}>
                  Status
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Typography variant='subtitle2' fontWeight={600}>
                  Totale
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant='subtitle2' fontWeight={600}>
                  UTM
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant='subtitle2' fontWeight={600}>
                  Confirm Payment
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders?.map((order, index) => {
              const utmData = parseUtmDetails(order.utm);

              return (
                <TableRow key={index}>
                  <TableCell>
                    <Typography
                      sx={{
                        fontSize: '15px',
                        fontWeight: '500',
                      }}
                    >
                      {index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography
                          style={{
                            textTransform: 'capitalize',
                          }}
                          variant='subtitle2'
                          fontWeight={600}
                        >
                          {`${
                            order.first_name === null
                              ? ''
                              : order.first_name.charAt(0).toUpperCase() +
                                order.first_name.slice(1)
                          } ${
                            order.last_name !== null
                              ? order.last_name.charAt(0).toUpperCase() +
                                order.last_name.slice(1)
                              : ' '
                          }`}
                        </Typography>
                        <Typography
                          color='textSecondary'
                          sx={{
                            fontSize: '13px',
                          }}
                        >
                          {formatPhoneNumberSafely(order.phone)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      color='textSecondary'
                      variant='subtitle2'
                      fontWeight={400}
                    >
                      {order._count.Ticket}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      sx={{
                        px: '4px',
                        backgroundColor:
                          PAYMENT_METHOD_COLORS[order.paymentMethod] ??
                          PAYMENT_METHOD_COLORS.DEFAULT,
                        color: '#fff',
                      }}
                      size='small'
                      label={order.paymentMethod}
                    ></Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      sx={{
                        px: '4px',
                        backgroundColor:
                          STATUS_COLORS[order.status] ?? '#00B0FF',
                        color: '#fff',
                      }}
                      size='small'
                      label={order.status}
                    ></Chip>
                    <Typography
                      color='textSecondary'
                      sx={{
                        fontSize: '12px',
                        mt: 1,
                      }}
                    >
                      {new Date(order.updatedAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='h6'>
                      {order.totalPrice.toLocaleString('en-GB', {
                        style: 'currency',
                        currency: 'GBP',
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={utmData.hasUtm ? 'Yes' : 'No'}
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        backgroundColor: utmData.hasUtm ? '#2e7d32' : '#757575',
                      }}
                    />
                    {utmData.hasUtm ? (
                      <Box sx={{ mt: 1 }}>
                        {utmData.entries.slice(0, 3).map(([key, value]) => (
                          <Typography
                            key={key}
                            color='textSecondary'
                            sx={{ fontSize: '11px', lineHeight: 1.35 }}
                          >
                            {`${key.replace('utm_', '')}: ${value}`}
                          </Typography>
                        ))}
                        {utmData.entries.length > 3 ? (
                          <Typography
                            color='textSecondary'
                            sx={{ fontSize: '11px', lineHeight: 1.35 }}
                          >
                            {`+${utmData.entries.length - 3} more`}
                          </Typography>
                        ) : null}
                      </Box>
                    ) : (
                      <Typography
                        color='textSecondary'
                        sx={{ fontSize: '11px', mt: 1 }}
                      >
                        No UTM details
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => confirmPayment(order.id)}
                      disabled={isLoading || order.status === 'CONFIRMED'}
                      variant='contained'
                    >
                      Confirm Payment
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </DashboardCard>
  );
};

export default OrderPerformance;
