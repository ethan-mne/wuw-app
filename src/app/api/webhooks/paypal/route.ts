/* eslint-disable */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/env';
import { db } from '@/server/db';
import { getPaypalAccessToken } from '@/server/payments/paypal';
import { HandelConfirmedORder } from '../lib';
import { isPaymentMethodEnabled } from '@/lib/payment-methods';

const payeeSchema = z
  .object({
    email_address: z.string(),
    merchant_id: z.string(),
  })
  .partial();

const amountSchema = z
  .object({
    value: z.string(),
    currency_code: z.string(),
  })
  .partial();

const linkSchema = z.object({
  href: z.string(),
  rel: z.string().optional(),
  method: z.string().optional(),
  encType: z.string().optional(),
});

const payerNameSchema = z
  .object({
    given_name: z.string(),
    surname: z.string(),
  })
  .partial();

const payerSchema = z
  .object({
    name: payerNameSchema.optional(),
    email_address: z.string().optional(),
    payer_id: z.string().optional(),
  })
  .partial();

const resourceSchema = z.object({
  payee: payeeSchema.optional(),
  amount: amountSchema.optional(),
  update_time: z.string().optional(),
  create_time: z.string().optional(),
  final_capture: z.boolean().optional(),
  seller_receivable_breakdown: z
    .object({
      paypal_fee: amountSchema,
      gross_amount: amountSchema,
      net_amount: amountSchema,
    })
    .optional(),
  links: z.array(linkSchema).optional(),
  id: z.string(),
  intent: z.string().optional(),
  payer: payerSchema.optional(),
  status: z.string().optional(),
});

const paypalWebhookSchema = z.object({
  id: z.string(),
  create_time: z.string(),
  resource_type: z.string(),
  event_type: z.string(),
  summary: z.string(),
  resource: resourceSchema,
  links: z.array(linkSchema),
  event_version: z.string(),
  resource_version: z.string(),
});

async function validatePayPalWebhook(request: Request) {
  try {
    console.log('🎯 Starting PayPal webhook validation');

    // Validate required environment variables
    const PAYPAL_API_BASE = env.PAYPAL_API_BASE;
    const PAYPAL_WEBHOOK_ID = env.PAYPAL_WEBHOOK_ID;

    if (!PAYPAL_API_BASE || !PAYPAL_WEBHOOK_ID) {
      throw new Error(
        'Missing required environment variables: PAYPAL_API_BASE or PAYPAL_WEBHOOK_ID',
      );
    }

    const headers = request.headers;
    const body = await request.text();

    console.log('📨 PayPal headers:', headers);
    console.log('📦 Raw webhook payload:', body);

    // Extract PayPal-specific headers
    const transmissionId = headers.get('paypal-transmission-id');
    const transmissionTime = headers.get('paypal-transmission-time');
    const certUrl = headers.get('paypal-cert-url');
    const authAlgo = headers.get('paypal-auth-algo');
    const transmissionSig = headers.get('paypal-transmission-sig');

    // Validate all required headers are present with specific error messages
    const missingHeaders = [];
    if (!transmissionId) missingHeaders.push('paypal-transmission-id');
    if (!transmissionTime) missingHeaders.push('paypal-transmission-time');
    if (!certUrl) missingHeaders.push('paypal-cert-url');
    if (!authAlgo) missingHeaders.push('paypal-auth-algo');
    if (!transmissionSig) missingHeaders.push('paypal-transmission-sig');

    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required PayPal headers: ${missingHeaders.join(', ')}`,
      );
    }

    // Fetch the PayPal access token
    const { access_token: accessToken } = await getPaypalAccessToken();
    console.log('🔑 PayPal access token:', accessToken);
    // Validate the webhook signature with PayPal with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const validationResponse = await fetch(
        `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth_algo: authAlgo,
            cert_url: certUrl,
            transmission_id: transmissionId,
            transmission_sig: transmissionSig,
            transmission_time: transmissionTime,
            webhook_id: PAYPAL_WEBHOOK_ID,
            webhook_event: JSON.parse(body),
          }),
          signal: controller.signal,
        },
      );

      if (!validationResponse.ok) {
        const errorText = await validationResponse.text();
        throw new Error(
          `PayPal webhook verification failed: ${validationResponse.status} ${validationResponse.statusText} - ${errorText}`,
        );
      }

      const validationResult = await validationResponse.json();

      // Check verification status
      if (validationResult.verification_status !== 'SUCCESS') {
        throw new Error(
          `Invalid PayPal webhook signature: ${validationResult.verification_status}`,
        );
      }

      console.log('✅ PayPal webhook validation completed successfully');
      return {
        body: JSON.parse(body),
        headers,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('❌ PayPal webhook validation failed:', error);
    throw error instanceof Error
      ? error
      : new Error('Unknown error during PayPal webhook validation');
  }
}

async function handlePaypalPaymentSuccess(
  payload: z.infer<typeof paypalWebhookSchema>,
  rawPayload: string,
) {
  console.log('💰 Processing payment success for payload:', payload);
  //order status is PENDING
  const paymentId = payload?.resource?.id;
  if (!paymentId) {
    throw new Error('Payment ID not found');
  }
  const order = await db.order.findFirst({
    where: {
      intentId: paymentId,
    },
  });
  if (!order) {
    throw new Error('Order not found');
  }
  return await db.order.update({
    where: { id: order.id },
    data: { status: 'PENDING' },
  });
}
async function handlePaypalPaymentCaptureCancelled(
  payload: z.infer<typeof paypalWebhookSchema>,
  rawPayload: string,
) {
  console.log('💰 Processing payment cancelled for payload:', payload);
  const payment = await db.order.findFirst({
    where: {
      intentId: payload?.resource?.id,
    },
  });
  if (!payment) {
    throw new Error('Payment not found');
  }
  return await db.order.update({
    where: { id: payment.id },
    data: { status: 'CANCELLED' },
  });
}

async function handlePaypalPaymentCaptureCompleted(
  payload: z.infer<typeof paypalWebhookSchema>,
  rawPayload: string,
) {
  console.log('💰 DEBUG: Starting handlePaypalPaymentCaptureCompleted');
  console.log('📦 Full payload:', JSON.stringify(payload, null, 2));

  try {
    // Check the payment ID from the payload
    const paymentId = payload?.resource?.id;
    console.log('🆔 DEBUG: Payment ID from payload:', paymentId);
    if (!paymentId) {
      throw new Error('Payment ID not found in payload');
    }

    // Find the order
    const payment = await db.order.findFirst({
      where: {
        intentId: paymentId,
      },
    });
    console.log('💳 DEBUG: Found payment:', payment);
    if (!payment) {
      throw new Error(`Order not found for paymentId: ${paymentId}`);
    }
    return HandelConfirmedORder(payment);
  } catch (error) {
    console.error('💥 Webhook Error:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'No stack trace',
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isPaymentMethodEnabled('PAYPAL')) {
    return NextResponse.json({ error: 'PayPal is not active' }, { status: 404 });
  }

  try {
    console.log('🎯 Webhook received at:', new Date().toISOString());
    const { body, headers } = await validatePayPalWebhook(request);

    const parse = paypalWebhookSchema.safeParse(body);
    console.log(
      '📋 Event type:',
      parse.success ? parse.data.event_type : 'Parse failed' + parse.error,
    );

    if (parse.success) {
      const { data: parsedPayload } = parse;
      if (parsedPayload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        await handlePaypalPaymentCaptureCompleted(parsedPayload, body);
      } else if (
        parsedPayload.event_type === 'PAYMENT.CAPTURE.CANCELLED' ||
        parsedPayload.event_type === 'PAYMENT.CAPTURE.DENIED' ||
        parsedPayload.event_type === 'PAYMENT.CAPTURE.FAILED'
      ) {
        await handlePaypalPaymentCaptureCancelled(parsedPayload, body);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 Webhook Error:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'No stack trace',
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
