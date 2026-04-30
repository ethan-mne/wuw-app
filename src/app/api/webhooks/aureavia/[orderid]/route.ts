import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { HandelConfirmedORder } from '../../lib';
import {
  verifyAureaviaSignature,
  ParsingAureaviaNotification,
} from '@/lib/aureavia';
import { isPaymentMethodEnabled } from '@/lib/payment-methods';

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: {
      orderid: string;
    };
  },
) {
  if (!isPaymentMethodEnabled('AUREAVIA')) {
    return NextResponse.json({ error: 'Aureavia is not active' }, { status: 404 });
  }

  try {
    const { orderid } = params;
    const formData = await req.formData();
    const notification = ParsingAureaviaNotification(formData);
    console.log(`🚀 ~ GET ~ formData:`, formData);
    // Verify the signature
    if (!verifyAureaviaSignature(notification)) {
      console.error('Invalid signature received from Aureavia');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    console.log('signature verified');
    const order = await db.order.findUniqueOrThrow({
      where: { id: orderid },
    });
    if (order.paymentId !== notification.trans_order) {
      console.error('payment id does not match');
      return NextResponse.json(
        { error: 'Payment id does not match' },
        { status: 400 },
      );
    }
    switch (notification.reply_code) {
      case '000':
        if (order.status === 'CONFIRMED') {
          console.error('order already confirmed');
          return NextResponse.json(
            { error: 'Order already confirmed' },
            { status: 400 },
          );
        }
        await HandelConfirmedORder(order);
        break;
    }
    return NextResponse.json(
      { message: 'Notification processed successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error processing successful payment:', error);
    return NextResponse.json(
      { error: 'Error processing payment' },
      { status: 500 },
    );
  }
}
