/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { faker } from '@faker-js/faker';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { calculateTotal } from '@/lib/utils';
import { NewOrderCreateSchema } from '@/server/utils';
import {
  type Competition,
  type PrismaClient,
  type referrals,
  type Order,
  type order_paymentMethod as PrismaOrderPaymentMethod,
  type order_status as PrismaOrderStatus,
} from '@prisma/client';
import { order_paymentMethod, order_status } from '@/lib/prisma-enums';
import { z } from 'zod';
import {
  StripePrimary,
  StripeSecondary,
  StripeTwelve,
  type StripeAccountType,
} from '@/lib/stripe';
import { env } from '@/env';
import { generateAureaviaPaymentOptions } from '@/lib/aureavia';
import { HandelConfirmedORder } from '@/app/api/webhooks/lib';
import { initializePayment } from '@/lib/worldcard';
import {
  getPaymentMethodForStripeAccount,
  selectStripeAccountFromEnv,
} from '@/lib/stripe-routing';

const paymentMethod = env.PAYMENT_METHODS;
const baseUrl = env.BASE_URL;

function getStripeClient(stripeAccount: StripeAccountType) {
  switch (stripeAccount) {
    case 'PRIMARY':
      return StripePrimary;
    case 'SECONDARY':
      return StripeSecondary;
    case 'TWELVE':
      return StripeTwelve;
  }
}

function getStripeGatewayUrl(stripeAccount: StripeAccountType): string {
  switch (stripeAccount) {
    case 'PRIMARY':
      return env.PAYMENT_GATEWAY_URL;
    case 'SECONDARY':
      return env.PAYMENT_GATEWAY_URL_SECONDARY;
    case 'TWELVE':
      return env.PAYMENT_GATEWAY_URL_TWELVE;
  }
}

function normalizeGatewayBaseUrl(gatewayUrl: string): string {
  return gatewayUrl.startsWith('http') ? gatewayUrl : `https://${gatewayUrl}`;
}

const GenerateRedirectUrls = <T extends boolean>(
  competitionId: string,
  orderId: string,
  baseUrl: string,
  stringFlag: T,
) => {
  const REDIRECT_URLS = {
    success: '/competitions/:id/:orderid/confirmation',
    payment: '/competitions/:id/:orderid',
    error: '/competitions/:id/:orderid/error',
    cancel: '/competitions/:id/',
  } as const;

  const urls = {
    success_url: `${baseUrl}${REDIRECT_URLS.success
      .replace(':id', competitionId)
      .replace(':orderid', orderId)}`,
    cancel_url: `${baseUrl}${REDIRECT_URLS.cancel.replace(
      ':id',
      competitionId,
    )}`,
    error_url: `${baseUrl}${REDIRECT_URLS.error.replace(':id', competitionId)}`,
    payment_url: `${baseUrl}${REDIRECT_URLS.payment.replace(':id', competitionId).replace(':orderid', orderId)}`,
  } as const;
  const string_url =
    `${env.NEXT_PUBLIC_PAYMENT_API}/w/${orderId}?${new URLSearchParams(urls).toString()}` as const;
  return (stringFlag ? string_url : urls) as T extends true
    ? typeof string_url
    : typeof urls;
};

async function createAUREAVIAPaymentLink(
  order: Order,
  url_redirect: string,
  prisma: PrismaClient,
  baseUrl: string,
  status: PrismaOrderStatus,
) {
  try {
    // Validate required fields
    if (!order.id || !order.first_name || !order.last_name) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Missing required order information',
      });
    }

    const { paymentOptions, signature, queryParams } =
      generateAureaviaPaymentOptions(order, baseUrl, url_redirect);
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        intentId: signature,
        paymentId: paymentOptions.trans_refNum,
        updatedAt: new Date(),
        status,
        // status: order_status.PENDING,
      },
    });

    return `https://uiservices.aureavia.com/hosted/?${queryParams.toString()}&signature=${encodeURIComponent(signature)}`;
  } catch (error) {
    console.error('Error creating Aureavia payment link:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create Aureavia payment link',
    });
  }
}

async function createStripePaymentLink(
  order: Order,
  competition: Competition & {
    Watches?: { brand: string; model: string } | null;
  },
  prisma: PrismaClient,
  status: PrismaOrderStatus,
  success_url: string,
  cancel_url: string,
  ticketCount: number,
  stripeAccount: StripeAccountType,
) {
  try {
    const stripeInstance = getStripeClient(stripeAccount);
    const gatewayBaseUrl = normalizeGatewayBaseUrl(
      getStripeGatewayUrl(stripeAccount),
    );

    const productName = `${ticketCount} VOUCHER${ticketCount === 1 ? '' : 'S'}`;

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: productName,
              images: competition.comp_image_url
                ? [competition.comp_image_url]
                : undefined,
            },
            unit_amount: Math.round((order.totalPrice / ticketCount) * 100), // Price per ticket in pennies
          },
          quantity: ticketCount,
        },
      ],
      mode: 'payment',
      success_url,
      cancel_url,
      customer_email: order.email,
      metadata: {
        order_id: order.id,
        competition_id: competition.id,
        competition_name: competition.name,
        ticket_count: ticketCount.toString(),
        customer_name:
          `${order.first_name ?? ''} ${order.last_name ?? ''}`.trim(),
        customer_email: order.email,
        total_amount: order.totalPrice.toString(),
        stripe_account: stripeAccount,
      },
    });

    if (!session.url) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No payment URL returned from Stripe',
      });
    }
    // Update order with the payment id and track which Stripe account was used
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status,
        paymentId: session.id,
        intentId: session.client_reference_id,
        paymentMethod: getPaymentMethodForStripeAccount(stripeAccount),
        updatedAt: new Date(),
      },
    });
    //instead of returning the url, we need to return the session id with our payment gateway
    const paymentUrl = `${gatewayBaseUrl}/payment?sessionid=${session.id}`;
    console.log('paymentUrl', paymentUrl, 'stripeAccount', stripeAccount);
    return paymentUrl;
  } catch (error) {
    console.error('Error creating Stripe payment:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create Stripe payment',
    });
  }
}

async function createWorldcardPaymentLink(
  order: Order,
  prisma: PrismaClient,
  status: PrismaOrderStatus,
  success_url: string,
) {
  const worldCardData = await initializePayment(order, success_url);
  if (!worldCardData.data || worldCardData.error) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Failed to initialize payment',
    });
  }
  console.log('worldCardData', worldCardData);
  await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      paymentId: worldCardData.data.merchantTransactionId,
      status,
      intentId: worldCardData.data.id,
      updatedAt: new Date(),
    },
  });
  return worldCardData.data;
}

// New function to handle redirect URL generation and payment link creation
async function generatePaymentResponse(
  order: Order,
  competitionID: string,
  baseUrl: string,
  status: PrismaOrderStatus,
  prisma: PrismaClient,
  ticketCount: number,
) {
  const { success_url, payment_url } = GenerateRedirectUrls(
    competitionID,
    order.id,
    baseUrl,
    false,
  );

  // Select Stripe account first to determine which gateway URL to use
  const stripeAccount = selectStripeAccountFromEnv(
    env.STRIPE_ACCOUNT_PERCENTAGES,
  );
  const gatewayBaseUrl = normalizeGatewayBaseUrl(
    getStripeGatewayUrl(stripeAccount),
  );

  // Generate redirect URLs using gateway URL as base for Stripe
  const stripeSuccessUrl = `${gatewayBaseUrl}/competitions/${competitionID}/${order.id}/confirmation`;
  const stripeCancelUrl = `${gatewayBaseUrl}/competitions/${competitionID}/`;

  const Competition = await prisma.competition.findUnique({
    where: {
      id: competitionID,
    },
    include: {
      Watches: {
        select: {
          brand: true,
          model: true,
        },
      },
    },
  });
  if (!Competition) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Competition not found',
    });
  }

  switch (order.paymentMethod) {
    case 'PAYPAL':
      return GenerateRedirectUrls(competitionID, order.id, baseUrl, true);
    case 'STRIPE': {
      return createStripePaymentLink(
        order,
        Competition,
        prisma,
        status,
        stripeSuccessUrl,
        stripeCancelUrl,
        ticketCount,
        stripeAccount,
      );
    }
    case 'AUREAVIA':
      return createAUREAVIAPaymentLink(
        order,
        success_url,
        prisma,
        baseUrl,
        status,
      );
    case 'WORLDCARD':
      return createWorldcardPaymentLink(order, prisma, status, success_url);
    default:
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid payment method',
      });
  }
}

export const paymentsRouter = createTRPCRouter({
  confirmPayment: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input },
      });
      if (!order) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order not found',
        });
      }
      return HandelConfirmedORder(order);
    }),

  // Test utility procedures - only available in non-production
  resetOrderForTesting: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: orderId }) => {
      // Only allow in non-production environments
      if (process.env.VERCEL_ENV === 'production') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Test utilities not available in production',
        });
      }
      const order = await ctx.prisma.order.update({
        where: { id: orderId },
        data: {
          status: order_status.INCOMPLETE,
          paymentMethod: order_paymentMethod.STRIPE, // Set a default instead of null
          paymentId: null,
          intentId: null,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        order,
      };
    }),

  getOrderTestDetails: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: orderId }) => {
      // Only allow in non-production environments
      if (process.env.VERCEL_ENV === 'production') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Test utilities not available in production',
        });
      }

      const order = await ctx.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          _count: {
            select: {
              Ticket: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      return {
        success: true,
        order,
      };
    }),

  createCheckoutSession: publicProcedure
    .input(
      z.object({
        order_id: z.string(),
        order_competition_id: z.string(),
        paymentMethod: z
          .nativeEnum(order_paymentMethod)
          .optional()
          .default(paymentMethod),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.update({
        where: { id: input.order_id },
        data: {
          paymentMethod: input.paymentMethod as PrismaOrderPaymentMethod,
          status: order_status.INCOMPLETE,
        },
        include: {
          _count: {
            select: {
              Ticket: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order not found',
        });
      }
      const paymentData = await generatePaymentResponse(
        order,
        input.order_competition_id,
        baseUrl,
        order_status.ATTEMPTED,
        ctx.prisma,
        (order as typeof order & { _count: { Ticket: number } })._count.Ticket,
      );
      return {
        order,
        paymentData,
      };
    }),
  createOrder: publicProcedure
    .input(NewOrderCreateSchema.omit({ paymentMethod: true }))
    .mutation(async ({ ctx, input }) => {
      const id = faker.string.uuid();
      const { comps, gift, ...data } = input;
      const bought_tickets = comps[0]?.ticketCount;
      if (!bought_tickets) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tickets number cannot be null',
        });
      }
      if (bought_tickets > 50) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum 50 tickets allowed per order',
        });
      }
      // Verify if coupon already used with this email (non logged users)
      if (data.coupon && !ctx.session) {
        const isCouponAlreadyUsed = await ctx.prisma.order.findFirst({
          where: {
            coupon: data.coupon,
            email: data.email,
          },
        });
        if (isCouponAlreadyUsed) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Coupon already used by this email',
          });
        }
      }
      let AffiliateData: referrals | null = null;
      if (comps[0]?.affiliateCode) {
        AffiliateData = await ctx.prisma.referrals.findUnique({
          where: {
            code: comps[0]?.affiliateCode,
          },
          // select: {
          //   discount_rate: true,
          //   code : true
          // },
        });
      }
      // Verify if order tickets are less than remaining tickets in competition
      const [TicketSoldquery, comp] = await Promise.all([
        ctx.prisma.$queryRaw<
          Array<{
            SoldTickets: bigint;
          }>
        >`
          SELECT COUNT(*) as SoldTickets
          FROM tickets
          JOIN \`order\` ON tickets.orderId = \`order\`.id
          WHERE \`order\`.status = 'confirmed' AND competitionId =${comps[0]?.competitionId};`,
        ctx.prisma.competition.findFirst({
          where: {
            id: comps[0]?.competitionId,
          },
          select: {
            total_tickets: true,
            ticket_price: true,
            status: true,
            end_date: true,
          },
        }),
      ]);
      const SoldTickets = TicketSoldquery[0]?.SoldTickets ?? 0;
      if (!comp) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Competition not found',
        });
      }

      // Check if competition is closed
      if (comp.status === 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Competition is closed',
        });
      }

      // Check if competition end date has passed
      if (comp.end_date && new Date() > comp.end_date) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Competition has ended',
        });
      }

      const remaining_tickets = comp.total_tickets - Number(SoldTickets);
      if (remaining_tickets === 0 || remaining_tickets < bought_tickets) {
        console.log(
          '🚀 ~ .mutation ~ if (remaining_tickets === 0 || remaining_tickets < bought_tickets):\t',
          remaining_tickets === 0 || remaining_tickets < bought_tickets,
        );
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Tickets are sold out`,
        });
      }
      //now we check if the total price is correct
      const total_price = calculateTotal(
        bought_tickets,
        comp.ticket_price,
        AffiliateData,
      ).total;
      if (total_price !== input.totalPrice) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Total price is incorrect',
        });
      }
      //now we create the order
      const order = await ctx.prisma.order.create({
        data: {
          id: id,
          ...data,
          paymentMethod: paymentMethod,
          status: order_status.INCOMPLETE,
          affiliationId: AffiliateData ? AffiliateData.code : null,
          Ticket: {
            createMany: {
              data: comps
                .map(({ competitionId, ticketCount, totalPrice }) =>
                  new Array(ticketCount).fill(0).map((_) => ({
                    competitionId: competitionId,
                    affiliation_reduction: AffiliateData
                      ? AffiliateData.discount_rate
                      : 0,
                    ticketPrice: totalPrice / ticketCount,
                  })),
                )
                .flat(),
            },
          },
        },
      });
      console.info('🧾 Order created', {
        orderId: order.id,
        competitionId: comps[0]?.competitionId ?? null,
        tickets: bought_tickets,
        totalPrice: order.totalPrice,
        initialPaymentMethod: order.paymentMethod,
        hasGift: Boolean(gift),
      });
      if (gift) {
        console.log('gift exists orderid : ', order.id, 'gift', gift);
        const addGift = await ctx.prisma.gift.create({
          data: {
            order_id: order.id,
            email: data.email,
            message: gift.message,
            fullname: data.first_name + ' ' + data.last_name,
          },
        });
      }
      const competitionID = comps[0]?.competitionId;
      if (!competitionID) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Competition ID is required',
        });
      }
      return {
        id: order.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        price_to_pay: order.totalPrice,
        paymentMethod,
        payment_url: GenerateRedirectUrls(
          competitionID,
          order.id,
          baseUrl,
          false,
        ).payment_url,
      };
    }),
});
