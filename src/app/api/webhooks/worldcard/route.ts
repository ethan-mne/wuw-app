import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { order_status } from '@/lib/prisma-enums';
import {
  decryptRequest,
  isValidPaymentCode,
  isPendingPaymentCode,
  isErrorPaymentCode,
} from '@/lib/worldcard/webhook';
import { getStatusCode } from '@/lib/worldcard/service';
import { HandelConfirmedORder } from '../lib';
import { env } from '@/env';
import { isPaymentMethodEnabled } from '@/lib/payment-methods';

export async function POST(request: Request) {
  if (!isPaymentMethodEnabled('WORLDCARD')) {
    return new NextResponse('Worldcard is not active', { status: 404 });
  }

  // console.log('⏩ Webhook received at:', new Date().toISOString());
  // console.log('🔒 Raw request headers:', Object.fromEntries(request.headers));
  // console.log('🔒 Raw request body:', body);
  const { error, data } = await decryptRequest(
    await request.json(),
    request.headers,
    env.WORLD_CARD_DEC_KEY,
  );
  if (error ?? !data) {
    console.error('🔑 Validation/decryption error:', error ?? 'No data');
    return new NextResponse('Invalid request', { status: 400 });
  }
  if (data.type !== 'PAYMENT') {
    console.log('Not a payment notification');
    return new NextResponse('Not a payment notification', { status: 200 });
  }
  console.log('Payment notification received');
  console.log('Decrypted webhook data:', data);
  const isPending = isPendingPaymentCode(data.payload.result.code);
  const isConfirmed = isValidPaymentCode(data.payload.result.code);
  const isError = isErrorPaymentCode(data.payload.result.code);
  if (!isPending && !isConfirmed && !isError) {
    console.log(
      'Invalid payment code:',
      getStatusCode(data.payload.result.code),
    );
    return new NextResponse('Invalid payment code', { status: 200 });
  }
  const order = await db.order.findFirst({
    where: {
      paymentId: data.payload.merchantTransactionId,
    },
  });
  if (!order) {
    console.log('Order not found');
    return new NextResponse('Order not found', { status: 200 });
  }
  console.log('Found order:', order);
  if (!data.payload.merchantTransactionId) {
    console.log('No merchant transaction ID in payload');
    return new NextResponse('No merchant transaction ID', { status: 200 });
  }
  if (isError) {
    console.log('Error payment code:', getStatusCode(data.payload.result.code));
    await db.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: order_status.CANCELLED,
      },
    });
    return new NextResponse('Error payment code', { status: 200 });
  }

  if (order.status === order_status.CONFIRMED) {
    console.log('Order already confirmed');
    return new NextResponse('Order already confirmed', { status: 200 });
  }
  if (isPending) {
    console.log('Order is pending');
    const res = await db.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: order_status.PENDING,
      },
    });
    console.log('Order updated to pending:', res.id);
    return new NextResponse('OK', { status: 200 });
  }
  if (isConfirmed) {
    await HandelConfirmedORder(order);
    console.log('Order confirmed successfully:', order.id);
    return new NextResponse('OK', { status: 200 });
  }
  console.log('Order is not pending or confirmed');
  return new NextResponse('Order is not pending or confirmed', { status: 200 });
}
