import { env } from '@/env';
import { StripePrimary, StripeSecondary, StripeTwelve } from '@/lib/stripe';
import type { StripeAccountType } from '@/lib/stripe';
import { db } from '@/server/db';
import { HandelConfirmedORder } from '../lib';
import { headers } from 'next/headers';
import type { Stripe as StripeType } from 'stripe';
import { getPaymentMethodForStripeAccount } from '@/lib/stripe-routing';
import {
  StripeWebhookVerificationError,
  verifyStripeWebhookEvent,
} from './webhook-verification';
import { isPaymentMethodEnabled } from '@/lib/payment-methods';

/** Returns the correct Stripe SDK instance for a given account */
function getStripeInstance(account: StripeAccountType) {
  switch (account) {
    case 'PRIMARY':
      return StripePrimary;
    case 'SECONDARY':
      return StripeSecondary;
    case 'TWELVE':
      return StripeTwelve;
  }
}

/**
 * Resolves a PaymentIntent ID back to its Checkout Session, finds the
 * associated order, and marks it CANCELLED.
 *
 * Used by both charge.failed and payment_intent.payment_failed handlers.
 */
async function cancelOrderByPaymentIntent(
  paymentIntentId: string,
  stripeAccount: StripeAccountType,
) {
  const stripe = getStripeInstance(stripeAccount);

  // Resolve PI → Checkout Session
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  const session = sessions.data[0];
  if (!session) {
    console.warn(
      `⚠️ No checkout session found for payment_intent ${paymentIntentId} on ${stripeAccount}`,
    );
    return;
  }

  const result = await db.order.updateMany({
    where: {
      paymentId: session.id,
      status: { not: 'CANCELLED' },
    },
    data: {
      status: 'CANCELLED',
    },
  });

  if (result.count > 0) {
    console.log(
      `🚫 Cancelled ${result.count} order(s) for session ${session.id} (PI: ${paymentIntentId}, account: ${stripeAccount})`,
    );
  } else {
    console.log(
      `ℹ️ No orders to cancel for session ${session.id} (PI: ${paymentIntentId}, account: ${stripeAccount}) — already cancelled or not found`,
    );
  }
}

/**
 * Webhook Handler for Multiple Stripe Accounts
 *
 * APPROACH:
 * Since all Stripe accounts send webhooks to the same endpoint, we need to:
 * 1. Try verifying the signature with PRIMARY account's secret first
 * 2. If that fails, try SECONDARY account's secret
 * 3. If that also fails, try TWELVE account's secret
 * 4. Once verified, determine which account sent it and validate accordingly
 * 5. Verify the order's paymentMethod matches the account
 * 6. Process the webhook
 *
 * This approach ensures:
 * - Security: Only valid webhooks from configured accounts are processed
 * - Accuracy: We verify the order matches the account that processed it
 * - Reliability: Works seamlessly with multiple accounts sharing one endpoint
 */
export async function POST(request: Request) {
  if (!isPaymentMethodEnabled('STRIPE')) {
    return new Response('Stripe is not active', { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const body = await request.text();
  const signature = headers().get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: StripeType.Event;
  let stripeAccount: 'PRIMARY' | 'SECONDARY' | 'TWELVE' = 'PRIMARY';
  try {
    const verificationResult = verifyStripeWebhookEvent((account) => {
      switch (account) {
        case 'PRIMARY':
          return StripePrimary.webhooks.constructEvent(
            body,
            signature,
            env.STRIPE_ENDPOINT_SECRET,
          );
        case 'SECONDARY':
          return StripeSecondary.webhooks.constructEvent(
            body,
            signature,
            env.STRIPE_ENDPOINT_SECRET_SECONDARY,
          );
        case 'TWELVE':
          return StripeTwelve.webhooks.constructEvent(
            body,
            signature,
            env.STRIPE_ENDPOINT_SECRET_TWELVE,
          );
      }
    });
    event = verificationResult.event;
    stripeAccount = verificationResult.stripeAccount;
    console.log(`✅ Webhook verified with ${stripeAccount} Stripe account`);
  } catch (error) {
    if (error instanceof StripeWebhookVerificationError) {
      console.error(
        '❌ Failed to verify webhook signature with all configured accounts:',
        {
          primaryError:
            error.accountErrors.PRIMARY instanceof Error
              ? error.accountErrors.PRIMARY.message
              : error.accountErrors.PRIMARY,
          secondaryError:
            error.accountErrors.SECONDARY instanceof Error
              ? error.accountErrors.SECONDARY.message
              : error.accountErrors.SECONDARY,
          twelveError:
            error.accountErrors.TWELVE instanceof Error
              ? error.accountErrors.TWELVE.message
              : error.accountErrors.TWELVE,
        },
      );
    } else {
      console.error('❌ Unexpected webhook verification error:', error);
    }
    return new Response('Invalid webhook signature', { status: 400 });
  }

  // Process the verified webhook event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as StripeType.Checkout.Session;
      try {
        const orderIdFromMetadata = session.metadata?.order_id;
        console.log('📦 Processing checkout.session.completed:', {
          sessionId: session.id,
          stripeAccount,
          orderId: orderIdFromMetadata,
        });

        if (!orderIdFromMetadata) {
          console.error(
            '❌ Missing order_id in session metadata:',
            session.id,
          );
          throw new Error('Missing order_id in session metadata');
        }

        // Look up the order by its canonical id (metadata.order_id) rather
        // than by paymentId. paymentId is written to the DB after the
        // Stripe session is created (see createStripePaymentLink), so any
        // race condition or transient failure in that write would leave
        // the webhook unable to find a valid order. The metadata.order_id
        // is set at session creation time and is guaranteed to reference
        // the actual Order.id.
        let order = await db.order.findUnique({
          where: {
            id: orderIdFromMetadata,
          },
        });

        if (!order) {
          console.error('❌ Order not found for order_id:', {
            orderId: orderIdFromMetadata,
            sessionId: session.id,
          });
          throw new Error('Order not found');
        }

        // If the order has a paymentId recorded, it must match this
        // session. Otherwise we're processing a webhook for a different
        // payment attempt against the same order.
        if (order.paymentId && order.paymentId !== session.id) {
          console.error('❌ Order paymentId mismatch:', {
            orderId: order.id,
            orderPaymentId: order.paymentId,
            sessionId: session.id,
          });
          throw new Error('Order paymentId mismatch');
        }

        // Self-heal: backfill paymentId if it was never persisted during
        // session creation (race condition / transient failure). This
        // ensures downstream handlers that still look up by paymentId
        // (e.g. charge.succeeded, charge.failed) can find the order.
        if (!order.paymentId) {
          console.warn(
            '⚠️ Order paymentId missing, backfilling from webhook:',
            {
              orderId: order.id,
              sessionId: session.id,
              stripeAccount,
            },
          );
          order = await db.order.update({
            where: { id: order.id },
            data: {
              paymentId: session.id,
              paymentMethod: getPaymentMethodForStripeAccount(stripeAccount),
              updatedAt: new Date(),
            },
          });
        }

        // Validate payment method matches the Stripe account
        const expectedPaymentMethod =
          getPaymentMethodForStripeAccount(stripeAccount);
        if (order.paymentMethod !== expectedPaymentMethod) {
          console.warn('⚠️ Payment method mismatch:', {
            orderPaymentMethod: order.paymentMethod,
            expectedPaymentMethod,
            stripeAccount,
            orderId: order.id,
          });
          // This is a warning but we still process - might be edge case during migration
        }

        console.log('✅ Order validated, confirming payment:', {
          orderId: order.id,
          paymentMethod: order.paymentMethod,
          stripeAccount,
        });

        // Process the confirmed order
        const confirmedOrder = await HandelConfirmedORder(order);
        console.log('✅ Order confirmed successfully:', confirmedOrder.id);

        return new Response('Order confirmed', { status: 200 });
      } catch (error) {
        console.error('❌ Error processing checkout session:', {
          error: error instanceof Error ? error.message : error,
          sessionId: session.id,
          stripeAccount,
        });
        return new Response('Error processing webhook', { status: 500 });
      }
    }

    // ── Informational events (no DB changes needed) ──────────────────

    case 'payment_intent.created': {
      const pi = event.data.object as StripeType.PaymentIntent;
      console.log(
        `ℹ️ PaymentIntent created: ${pi.id} (${stripeAccount} account)`,
      );
      return new Response('Webhook received', { status: 200 });
    }

    case 'charge.succeeded': {
      const charge = event.data.object as StripeType.Charge;
      const chargePiId =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;

      console.log(
        `💰 Charge succeeded: ${charge.id} for PI ${chargePiId} (${stripeAccount} account)`,
      );

      if (!chargePiId) {
        console.warn('⚠️ No payment_intent on charge, skipping');
        return new Response('Webhook received', { status: 200 });
      }

      try {
        const stripe = getStripeInstance(stripeAccount);
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: chargePiId,
          limit: 1,
        });

        const chargeSession = sessions.data[0];
        if (!chargeSession) {
          console.warn(
            `⚠️ No checkout session found for PI ${chargePiId} on ${stripeAccount}`,
          );
          return new Response('Webhook received', { status: 200 });
        }

        const order = await db.order.findFirst({
          where: { paymentId: chargeSession.id },
        });

        if (!order) {
          console.warn(
            `⚠️ No order found for session ${chargeSession.id} (charge.succeeded)`,
          );
          return new Response('Webhook received', { status: 200 });
        }

        // Skip if already confirmed to avoid double-processing
        if (order.status === 'CONFIRMED') {
          console.log(
            `ℹ️ Order ${order.id} already confirmed, skipping charge.succeeded`,
          );
          return new Response('Webhook received', { status: 200 });
        }

        const expectedPaymentMethod =
          getPaymentMethodForStripeAccount(stripeAccount);
        if (order.paymentMethod !== expectedPaymentMethod) {
          console.warn('⚠️ Payment method mismatch on charge.succeeded:', {
            orderPaymentMethod: order.paymentMethod,
            expectedPaymentMethod,
            stripeAccount,
            orderId: order.id,
          });
        }

        const confirmedOrder = await HandelConfirmedORder(order);
        console.log(
          `✅ Order confirmed via charge.succeeded: ${confirmedOrder.id}`,
        );

        return new Response('Order confirmed', { status: 200 });
      } catch (error) {
        console.error('❌ Error processing charge.succeeded:', {
          error: error instanceof Error ? error.message : error,
          chargeId: charge.id,
          paymentIntentId: chargePiId,
          stripeAccount,
        });
        return new Response('Error processing webhook', { status: 500 });
      }
    }

    // ── Failure events – cancel the associated order ─────────────────

    case 'charge.failed': {
      const failedCharge = event.data.object as StripeType.Charge;
      const piId =
        typeof failedCharge.payment_intent === 'string'
          ? failedCharge.payment_intent
          : failedCharge.payment_intent?.id;

      console.log(
        `🚫 Charge failed: ${failedCharge.id} for PI ${piId} (${stripeAccount} account)`,
      );

      if (piId) {
        try {
          await cancelOrderByPaymentIntent(piId, stripeAccount);
        } catch (error) {
          console.error('❌ Error cancelling order for charge.failed:', {
            error: error instanceof Error ? error.message : error,
            chargeId: failedCharge.id,
            paymentIntentId: piId,
            stripeAccount,
          });
          return new Response('Error processing webhook', { status: 500 });
        }
      }

      return new Response('Webhook received', { status: 200 });
    }

    case 'payment_intent.payment_failed': {
      const failedPI = event.data.object as StripeType.PaymentIntent;

      console.log(
        `🚫 PaymentIntent failed: ${failedPI.id} (${stripeAccount} account)`,
      );

      try {
        await cancelOrderByPaymentIntent(failedPI.id, stripeAccount);
      } catch (error) {
        console.error(
          '❌ Error cancelling order for payment_intent.payment_failed:',
          {
            error: error instanceof Error ? error.message : error,
            paymentIntentId: failedPI.id,
            stripeAccount,
          },
        );
        return new Response('Error processing webhook', { status: 500 });
      }

      return new Response('Webhook received', { status: 200 });
    }

    default:
      console.log(
        `ℹ️ Unhandled event type: ${event.type} from ${stripeAccount} account`,
      );
  }

  return new Response('Webhook received', { status: 200 });
}
