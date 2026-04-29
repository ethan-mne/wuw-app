/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable  @typescript-eslint/restrict-template-expressions */
import { env } from '@/env';
import { db as prisma } from '@/server/db';
import type { NextApiRequest, NextApiResponse } from 'next';
import rawBody from 'raw-body';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

// eslint-disable-next-line import/no-anonymous-default-export
export default async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === 'POST') {
    const body = await rawBody(request);
    const signature = request.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_ENDPOINT_SECRET,
      );
    } catch (error) {
      return (
        console.error(`⚠️ Webhook signature verification failed.`, error),
        response.status(400).send(`Webhook Error`)
      );
    }
    //console.log( event.data);

    switch (event.type) {
      //PAYMENT FAILED OR CANCELLED
      case 'payment_intent.payment_failed':
        const checkoutSessionFailed = event.data.object as {
          id: string;
          payment_intent: string;
        };
        console.log('checkoutsessionFailed: ', checkoutSessionFailed);

        await prisma.order.updateMany({
          where: {
            paymentId: checkoutSessionFailed.id,
          },
          data: {
            status: 'CANCELLED',
          },
        });
        // THIS CASE CHANGES STATUS IF PAYMENT FAILS BUT DOES NOT DELETE TICKETS
        // TODO:
        //  await prisma.ticket.deleteMany({
        //   where: {
        //     paymentId: checkoutSessionFailed.id,
        //   }
        //  })

        break;
      //CHECKOUT SESSION PAYMENT FAILED
      case 'checkout.session.async_payment_failed':
        const checkoutSessionPayFailed = event.data.object as {
          id: string;
          payment_intent: string;
        };
        console.log('checkoutSessionPayFailed: ', checkoutSessionPayFailed);

        await prisma.order.updateMany({
          where: {
            paymentId: checkoutSessionPayFailed.id,
          },
          data: {
            status: 'CANCELLED',
          },
        });
        break;
      // THIS CASE CHANGES STATUS IF PAYMENT FAILS BUT DOES NOT DELETE TICKETS
      // TODO:
      //  await prisma.ticket.deleteMany({
      //   where: {
      //     id: must be orderID,
      //   }
      //  })
      // PAYMENT SUCCEEDED
      case 'payment_intent.succeeded':
        const checkoutSessionPayCompleted = event.data.object as {
          id: string;
          payment_intent: string;
        };
        console.log('checkoutsessionCompleted: ', checkoutSessionPayCompleted);

        if (
          await prisma.order.updateMany({
            where: {
              paymentId: checkoutSessionPayCompleted.id,
            },
            data: {
              intentId: checkoutSessionPayCompleted.payment_intent,
              status: 'CONFIRMED',
            },
          })
        ) {
          break;
        }
      // CHECKOUT IS COMPLETE
      case 'checkout.session.completed':
        const checkoutSessionCompleted = event.data.object as {
          id: string;
          payment_intent: string;
        };
        console.log('checkoutsessionCompleted: ', checkoutSessionCompleted);

        if (
          await prisma.order.updateMany({
            where: {
              paymentId: checkoutSessionCompleted.id,
            },
            data: {
              intentId: checkoutSessionCompleted.payment_intent,
              status: 'CONFIRMED',
            },
          })
        ) {
          break;
        }
      //CHECKOUT IS CANCELLED
      case 'payment_intent.canceled':
        const checkoutSessionCancelled = event.data.object as {
          id: string;
          payment_intent: string;
        };
        console.log('checkoutsessionCancelled: ', checkoutSessionCancelled);

        if (
          await prisma.order.updateMany({
            where: {
              paymentId: checkoutSessionCancelled.id,
            },
            data: {
              status: 'CANCELLED',
            },
          })
        ) {
          break;
        }

      //REFUNDED
      // case "charge.refunded":
      //   const chargeREFUNDED = event.data.object as {
      //     id: string;
      //     payment_intent: string;
      //   };
      //   console.log("checkoutsessionCancelled: ", chargeREFUNDED);

      //   if (
      //     await prisma.order.updateMany({
      //       where: {
      //         paymentId: chargeREFUNDED.id,
      //       },
      //       data: {
      //         status: "REFUNDED",
      //       },
      //     })
      //   ) {
      //     return response.json({});
      //   }
      //   break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    //console.log(event.data);
    return response.json({});
  }
};
