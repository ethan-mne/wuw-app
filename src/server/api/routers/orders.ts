import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc';
import { faker } from '@faker-js/faker';
import {
  order_paymentMethod as PaymentMethod,
  order_status,
} from '@/lib/prisma-enums';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { CreateOrderSchema } from '@/server/utils';
import { GetData, emailSender } from '.';
import { type LiveCompetitions } from '@/lib/types';
import { sendConfirmationEmail } from '@/lib/sendConfirmationEmail';

export const OrderRouter = createTRPCRouter({
  ordersEmails: protectedProcedure.mutation(
    ({ ctx }) =>
      ctx.prisma.$queryRaw<
        Array<{
          email: string;
        }>
      >`select distinct email from \`order\` where email is not null;`,
  ),
  redeemFreeTicket: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (!input) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Competition id cannot be null',
        });
      }
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User session cannot be null',
        });
      }
      const profile = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });
      const comp = await ctx.prisma.competition.findUnique({
        where: {
          id: input,
        },
        select: {
          id: true,
          total_tickets: true,
          name: true,
          end_date: true,
          price: true,
          ticket_price: true,
          remaining_tickets: true,
          status: true,
          max_winners: true,
          cash_alternative: true,
          Watches: {
            include: {
              images_url: true,
            },
          },
          _count: {
            select: {
              Ticket: {
                where: {
                  Order: {
                    status: 'CONFIRMED',
                  },
                },
              },
            },
          },
        },
      });
      const refferal = await ctx.prisma.referrals.findUnique({
        where: {
          user_id: ctx.session.user.id,
        },
      });

      try {
        if (!profile || profile.wincoin < 100)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User not eligible. Something went wrong',
          });
        if (!comp)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Competition not found',
          });
        if (!refferal)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User not eligible. Something went wrong',
          });
        // Use confirmed tickets as the source of truth; the persisted
        // remaining_tickets column can be out of sync.
        const availability = await ctx.prisma.competition.findUnique({
          where: { id: comp.id },
          select: {
            total_tickets: true,
            _count: {
              select: {
                Ticket: { where: { Order: { status: 'CONFIRMED' } } },
              },
            },
          },
        });

        if (!availability || availability.total_tickets - availability._count.Ticket < 1)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This competition is sold out',
          });

        const createdOrder = await ctx.prisma.$transaction(async (tx) => {
          const confirmedTickets = await tx.ticket.count({
            where: {
              competitionId: comp.id,
              Order: {
                status: 'CONFIRMED',
              },
            },
          });

          if (comp.total_tickets - confirmedTickets < 1) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'This competition is sold out',
            });
          }

          const order = await tx.order.create({
            data: {
              id: faker.string.uuid(),
              email: profile.email,
              phone: profile.phone ?? '',
              first_name: profile.firstName,
              last_name: profile.lastName,
              paymentMethod: 'WINCOIN',
              totalPrice: 0,
              status: 'CONFIRMED',
              Ticket: {
                create: {
                  ticketPrice: 0,
                  reduction: 0,
                  competitionId: comp.id,
                  affiliation_reduction: 0,
                },
              },
            },
          });

          await tx.user.update({
            where: { id: profile.id },
            data: { wincoin: 0 },
          });

          return order;
        });
        // Fire-and-forget: email failure must not roll back an already-committed order
        sendConfirmationEmail({
          identifier: profile.email,
          order_id: createdOrder.id,
          competition: comp,
          buyer_name: `${profile.firstName} ${profile.lastName}`,
          paymentMethod: PaymentMethod.WINCOIN,
        }).catch((err) => console.error('Failed to send free-ticket confirmation email:', err));
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[redeemFreeTicket] Unexpected error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Error while adding free ticket',
          cause: error,
        });
      }
    }),
  getOrderHistory: protectedProcedure.query(async ({ ctx, input }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Session not found',
      });
    }
    const historyFetch = await ctx.prisma.order.findMany({
      where: {
        email: ctx.session.user.email,
        status: 'CONFIRMED',
      },
      select: {
        id: true,
        createdAt: true,
        Ticket: {
          take: 1,
          select: {
            Competition: {
              select: {
                end_date: true,
                name: true,
                Watches: {
                  select: {
                    images_url: {
                      select: {
                        url: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            Ticket: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return historyFetch;
  }),
  getLiveCompetitions: protectedProcedure.query(async ({ ctx, input }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Session not found',
      });
    }
    const liveCompetitionFetch = await ctx.prisma
      .$queryRaw<LiveCompetitions>`SELECT 
  c.id, 
  c.name, 
  c.end_date, 
  (SELECT iu.url FROM images_url iu WHERE iu.WatchesId = c.watchesId ORDER BY iu.id LIMIT 1) AS img_url,
  COUNT(*) AS ticket_count
      FROM 
  tickets t
  INNER JOIN \`order\` o ON t.orderId = o.id AND o.status = 'CONFIRMED' AND o.email = ${ctx.session.user.email}
  INNER JOIN competition c ON c.id = t.competitionId AND c.status ='ACTIVE' 
  GROUP BY 
  c.id, 
  c.name, 
  c.end_date;`;

    return liveCompetitionFetch;
  }),

  getAll: publicProcedure.input(z.string()).query(
    async ({ ctx, input }) =>
      await ctx.prisma.order.findMany({
        where: {
          Ticket: {
            some: {
              Competition: {
                id: input,
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          Ticket: {
            where: {
              competitionId: input,
            },
          },
        },
      }),
  ),
  getOrderDetails: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const data = await GetData(input, ctx.prisma);
      if (!data.order) {
        throw new Error('Order not found');
      }
      return data;
    }),
  getOrder: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const data = await GetData(input, ctx.prisma);
      if (!data.order) {
        throw new Error('Order not found');
      }

      await emailSender({
        from: 'noreply@winuwatch.uk',
        cc: 'admin@winuwatch.uk',
        to: data.order.email,
        subject: `Order Confirmation - Winuwatch #${data.order?.id ?? '000000'}`,
        html: '', //Email(data),
      });
      return data.order;
    }),
  getOrderCheck: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: {
          id: input,
        },
      });
      //const data = await GetData(input, ctx.prisma);
      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      return order;
    }),
  getOrderName: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const data = await ctx.prisma.order.findUnique({
        where: {
          id: input,
        },
      });
      return {
        fullname: String(data?.first_name) + ' ' + String(data?.last_name),
      };
    }),
  SendFreeTickets_fixed: protectedProcedure
    .input(
      z.object({
        compId: z.string(),
        orderId: z.string(),
        numTickts: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [NextComp, OgOrder] = await ctx.prisma.$transaction([
        ctx.prisma.competition.findFirstOrThrow({
          where: {
            id: input.compId,
          },
          include: {
            Ticket: {
              where: {
                competitionId: input.compId,
                orderId: input.orderId,
              },
            },
            Watches: {
              include: {
                images_url: true,
              },
            },
            _count: {
              select: {
                Ticket: true,
              },
            },
          },
        }),
        ctx.prisma.order.findFirstOrThrow({
          where: {
            id: input.orderId,
          },
        }),
      ]);

      const referral = ctx.session?.user.id
        ? await ctx.prisma.referrals.findFirst({
            where: {
              user_id: ctx.session.user.id,
            },
          })
        : null;
      const { id, ...rest } = OgOrder;
      const FreeticketOrder = await ctx.prisma.order.create({
        data: {
          ...rest,
          paymentMethod: PaymentMethod.MARKETING, //this needs to be chnaged
          status: order_status.CONFIRMED,
          totalPrice: 0,
          createdAt: new Date(),
          Ticket: {
            create: Array.from({ length: input.numTickts }).map(() => ({
              Competition: {
                connect: {
                  id: input.compId,
                },
              },
            })),
          },
        },
        include: {
          Ticket: true,
        },
      });
      // const updateRemainingTickets = await ctx.prisma.competition.update({
      //   where: {
      //     id: input.compId,
      //   },
      //   data: {
      //     remaining_tickets: {
      //       decrement: input.numTickts,
      //     },
      //   },
      // });

      // await emailSender({
      //   from: 'noreply@winuwatch.uk',
      //   cc: 'admin@winuwatch.uk',
      //   to: OgOrder?.email,
      //   subject: `Here are your free tickets - Winuwatch`,
      //   html: '', //EmailF({
      //   //   order: FreeticketOrder,
      //   //   numTickts: input.numTickts,
      //   //   comp: NextComp,
      //   // }),
      // });
      await sendConfirmationEmail({
        identifier: FreeticketOrder.email,
        order_id: FreeticketOrder.id,
        competition: NextComp,
        buyer_name: `${FreeticketOrder.first_name} ${FreeticketOrder.last_name}`,
        isFree: true,
        paymentMethod: PaymentMethod.MARKETING,
      });
      return FreeticketOrder;
    }),
  getComps: protectedProcedure.query(
    async ({ ctx }) =>
      await ctx.prisma.competition.findMany({
        orderBy: {
          end_date: 'desc',
        },
      }),
  ),

  //   AddTicketsAfterConfirmation: publicProcedure
  //     .input(
  //       z.object({
  //         status: z.nativeEnum(order_status).optional(),
  //         paymentId: z.string().optional(),
  //         id: z.string(),
  //         comps: Comps,
  //       }),
  //     )
  //     .mutation(async ({ ctx, input }) => {
  //       try {
  //         let affiliation: { discountRate: number; competitionId: string } | null;

  //         const order = await ctx.prisma.order.findUnique({
  //           where: {
  //             id: input.id,
  //           },
  //           select: {
  //             affiliationId: true,
  //           },
  //         });

  //         if (order?.affiliationId != null) {
  //           affiliation = await ctx.prisma.affiliation.findUnique({
  //             where: {
  //               id: order.affiliationId,
  //             },
  //             select: {
  //               discountRate: true,
  //               competitionId: true,
  //             },
  //           });
  //         }
  //         if (input.comps.length > 0) {
  //           await ctx.prisma.order.update({
  //             where: {
  //               id: input.id,
  //             },
  //             data: {
  //               status: input.status ?? order_status.PENDING,
  //               paymentId: input.paymentId,
  //               Ticket: {
  //                 createMany: {
  //                   data: input.comps
  //                     .map(
  //                       ({
  //                         reduction,
  //                         price_per_ticket,
  //                         compID,
  //                         number_tickets,
  //                       }) =>
  //                         new Array(number_tickets).fill(0).map((_) => ({
  //                           competitionId: compID,
  //                           ticketPrice: price_per_ticket,
  //                           reduction: reduction ? reduction : 0,
  //                           affiliation_reduction:
  //                             affiliation?.competitionId == compID
  //                               ? affiliation.discountRate
  //                               : 0,
  //                         })),
  //                     )
  //                     .flat(),
  //                 },
  //               },
  //             },
  //           });

  //           const data = await GetData(input.id, ctx.prisma);
  //           if (!data.order) {
  //             throw new Error('Order not found');
  //           }
  //           // we are getting all the affiliations that the user has, and all the orders that he won in the competitions he passed in the order
  //           const [clientAffiliations, orders] = await Promise.all([
  //             ctx.prisma.affiliation.findMany({
  //               where: {
  //                 ownerEmail: data.order.email,
  //                 uses: {
  //                   gt: 4,
  //                 },
  //               },
  //             }),
  //             ctx.prisma.order.findMany({
  //               where: {
  //                 email: data.order.email,
  //                 status: 'CONFIRMED',
  //                 paymentMethod: 'AFFILIATION',
  //                 totalPrice: 0,
  //               },
  //               include: {
  //                 Ticket: {
  //                   where: {
  //                     competitionId: {
  //                       in: input.comps.map(({ compID }) => compID),
  //                     },
  //                   },
  //                 },
  //               },
  //             }),
  //           ]);

  //           if (
  //             !!clientAffiliations.length &&
  //             orders.length < input.comps.length &&
  //             !!data.order?.email
  //           ) {
  //             // if the user has affiliations and he won less than the comps he passed in the order
  //             // we need to add the affiliations to the order
  //             const compsNotWon = input.comps.filter(
  //               ({ compID }) =>
  //                 !orders.some(({ Ticket }) =>
  //                   Ticket.some(({ competitionId }) => competitionId === compID),
  //                 ),
  //             );
  //             compsNotWon.map(async ({ compID }) => {
  //               // create order with number of tickets = Math.floor(uses / 5)
  //               if (
  //                 clientAffiliations.some((comp) => comp.compToWin === compID)
  //               ) {
  //                 const number_tickets = Math.floor(
  //                   (clientAffiliations.find((comp) => comp.compToWin === compID)
  //                     ?.uses ?? 0) / 5,
  //                 );
  //                 await ctx.prisma.$transaction(async (tx) => {
  //                   const addedOrder = await tx.order.create({
  //                     data: {
  //                       first_name: data.order?.first_name,
  //                       last_name: data.order?.last_name,
  //                       phone: data.order?.phone ?? '',
  //                       email: data.order?.email ?? '',
  //                       address: data.order?.address,
  //                       country: data.order?.country,
  //                       zip: data.order?.zip,
  //                       town: data.order?.town,
  //                       paymentMethod: 'AFFILIATION',
  //                       status: 'CONFIRMED',
  //                       totalPrice: 0,
  //                       Ticket: {
  //                         createMany: {
  //                           data: new Array(number_tickets).fill(0).map((_) => ({
  //                             competitionId: compID,
  //                           })),
  //                         },
  //                       },
  //                     },
  //                   });

  //                   await tx.competition.update({
  //                     where: {
  //                       id: compID,
  //                     },
  //                     data: {
  //                       remaining_tickets: {
  //                         decrement: number_tickets,
  //                       },
  //                     },
  //                   });
  //                   // TODO: Send email
  //                   await emailSender({
  //                     from: 'noreply@winuwatch.uk',
  //                     cc: 'admin@winuwatch.uk',
  //                     to: addedOrder.email,
  //                     subject: `Here is your free tickets - Winuwatch`,
  //                     html: '',
  //                     // html: Email({
  //                     //   order: addedOrder,
  //                     //   comps: await tx.competition
  //                     //     .findMany({
  //                     //       include: {
  //                     //         Ticket: {
  //                     //           where: {
  //                     //             orderId: addedOrder.id,
  //                     //           },
  //                     //         },
  //                     //         Watches: {
  //                     //           include: {
  //                     //             images_url: true,
  //                     //           },
  //                     //         },
  //                     //       },
  //                     //     })
  //                     //     .then((e) =>
  //                     //       e
  //                     //         .filter(({ Ticket }) => Ticket.length > 0)
  //                     //         .map((comp) => ({
  //                     //           ...comp,
  //                     //           affiliationCode: "",
  //                     //           affiliationRate: 0,
  //                     //         }))
  //                     //     ),
  //                     // }),
  //                   });
  //                 });
  //               }
  //             });
  //           }

  //           //! What I've added
  //           if (!!data.order?.affiliationId) {
  //             await ctx.prisma.$transaction(async (tx) => {
  //               const updatedAffiliation = await tx.affiliation.update({
  //                 where: {
  //                   id: data?.order?.affiliationId ?? undefined,
  //                 },
  //                 data: {
  //                   uses: {
  //                     increment: 1,
  //                   },
  //                 },
  //               });

  //               if (updatedAffiliation && updatedAffiliation.uses % 5 === 0) {
  //                 // get next competition
  //                 const nextCompetition = await tx.competition.findFirst({
  //                   where: {
  //                     id: {
  //                       not: updatedAffiliation.competitionId,
  //                     },
  //                     status: 'ACTIVE',
  //                     start_date: {
  //                       gt: await tx.competition
  //                         .findUnique({
  //                           where: {
  //                             id: updatedAffiliation.competitionId,
  //                           },
  //                         })
  //                         .then((comp) => comp?.start_date),
  //                     },
  //                   },
  //                   orderBy: {
  //                     start_date: 'asc',
  //                   },
  //                   include: {
  //                     Watches: {
  //                       include: {
  //                         images_url: true,
  //                       },
  //                     },
  //                   },
  //                 });

  //                 console.log('next comp is ===>', nextCompetition);

  //                 // get owner previous orders on the next competition if exists, if not, for the current competition
  //                 const prevWonOrder = await tx.order.findFirst({
  //                   where: {
  //                     email: updatedAffiliation.ownerEmail,
  //                     status: 'CONFIRMED',
  //                     paymentMethod: 'AFFILIATION',
  //                     totalPrice: 0,
  //                     Ticket: {
  //                       some: {
  //                         competitionId: !nextCompetition
  //                           ? updatedAffiliation.competitionId
  //                           : nextCompetition?.id,
  //                       },
  //                     },
  //                   },
  //                 });
  //                 console.log('prev won order is ===>', prevWonOrder);

  //                 const orderOnNextComp = updatedAffiliation.compToWin
  //                   ? await tx.order.findFirst({
  //                       where: {
  //                         email: updatedAffiliation.ownerEmail,
  //                         status: 'CONFIRMED',
  //                         paymentMethod: {
  //                           not: 'AFFILIATION',
  //                         },
  //                         totalPrice: {
  //                           not: 0,
  //                         },
  //                         Ticket: {
  //                           some: {
  //                             competitionId: updatedAffiliation.compToWin,
  //                           },
  //                         },
  //                       },
  //                     })
  //                   : null;
  //                 if (!!prevWonOrder) {
  //                   // if the owner has previous orders on the next competition, we need to add another ticket to the order

  //                   await tx.ticket
  //                     .create({
  //                       data: {
  //                         competitionId: !nextCompetition
  //                           ? updatedAffiliation.competitionId
  //                           : nextCompetition?.id,
  //                         orderId: prevWonOrder.id,
  //                       },
  //                     })
  //                     .then((res) => console.log('ticket added', res));

  //                   await tx.competition
  //                     .update({
  //                       where: {
  //                         id: !!nextCompetition
  //                           ? nextCompetition.id
  //                           : updatedAffiliation.competitionId,
  //                       },
  //                       data: {
  //                         remaining_tickets: {
  //                           decrement: 1,
  //                         },
  //                       },
  //                     })
  //                     .then((res) => console.log('comp updated', res));

  //                   await tx.affiliation
  //                     .update({
  //                       where: {
  //                         id: updatedAffiliation.id,
  //                       },
  //                       data: {
  //                         compToWin: !!nextCompetition
  //                           ? nextCompetition.id
  //                           : updatedAffiliation.competitionId,
  //                       },
  //                     })
  //                     .then((res) => console.log('affiliation updated', res));

  //                   await emailSender({
  //                     from: 'noreply@winuwatch.uk',
  //                     cc: 'admin@winuwatch.uk',

  //                     to: updatedAffiliation.ownerEmail,
  //                     subject: `Claim your free ticket - Winuwatch`,
  //                     html: '',
  //                     // html: Email({
  //                     //   order: prevWonOrder,
  //                     //   comps: await tx.competition
  //                     //     .findMany({
  //                     //       include: {
  //                     //         Ticket: {
  //                     //           where: {
  //                     //             orderId: prevWonOrder.id,
  //                     //           },
  //                     //         },
  //                     //         Watches: {
  //                     //           include: {
  //                     //             images_url: true,
  //                     //           },
  //                     //         },
  //                     //       },
  //                     //     })
  //                     //     .then((e) =>
  //                     //       e
  //                     //         .filter(({ Ticket }) => Ticket.length > 0)
  //                     //         .map((comp) => ({
  //                     //           ...comp,
  //                     //           affiliationCode: "",
  //                     //           affiliationRate: 0,
  //                     //         }))
  //                     //     ),
  //                     // }),
  //                   });
  //                 } else if (
  //                   !!updatedAffiliation.compToWin &&
  //                   !!orderOnNextComp
  //                 ) {
  //                   // if he already ordered on the next competition, we need to send him an email to claim his ticket
  //                   const number_tickets = Math.floor(
  //                     updatedAffiliation.uses / 5,
  //                   );
  //                   const newOrder = await tx.order.create({
  //                     data: {
  //                       first_name: orderOnNextComp.first_name,
  //                       last_name: orderOnNextComp.last_name,
  //                       email: updatedAffiliation.ownerEmail,
  //                       phone: orderOnNextComp.phone,
  //                       address: orderOnNextComp.address,
  //                       country: orderOnNextComp.country,
  //                       town: orderOnNextComp.town,
  //                       zip: orderOnNextComp.zip,
  //                       status: 'CONFIRMED',
  //                       paymentMethod: 'AFFILIATION',
  //                       totalPrice: 0,
  //                       Ticket: {
  //                         createMany: {
  //                           data: new Array(number_tickets).fill(0).map((_) => ({
  //                             competitionId: updatedAffiliation.compToWin ?? '',
  //                           })),
  //                         },
  //                       },
  //                     },
  //                   });
  //                   await tx.competition.update({
  //                     where: {
  //                       id: updatedAffiliation.competitionId,
  //                     },
  //                     data: {
  //                       remaining_tickets: {
  //                         decrement: 1,
  //                       },
  //                     },
  //                   });
  //                   await emailSender({
  //                     from: 'noreply@winuwatch.uk',
  //                     cc: 'admin@winuwatch.uk',
  //                     to: newOrder.email,
  //                     subject: `Here is your free tickets - Winuwatch`,
  //                     html: '',
  //                     // html: Email({
  //                     //   order: newOrder,
  //                     //   comps: await tx.competition
  //                     //     .findMany({
  //                     //       include: {
  //                     //         Ticket: {
  //                     //           where: {
  //                     //             orderId: newOrder.id,
  //                     //           },
  //                     //         },
  //                     //         Watches: {
  //                     //           include: {
  //                     //             images_url: true,
  //                     //           },
  //                     //         },
  //                     //       },
  //                     //     })
  //                     //     .then((e) =>
  //                     //       e
  //                     //         .filter(({ Ticket }) => Ticket.length > 0)
  //                     //         .map((comp) => ({
  //                     //           ...comp,
  //                     //           affiliationCode: "",
  //                     //           affiliationRate: 0,
  //                     //         }))
  //                     //     ),
  //                     // }),
  //                   });
  //                 } else {
  //                   // TODO: Send email
  //                   await tx.affiliation.update({
  //                     where: {
  //                       id: updatedAffiliation.id,
  //                     },
  //                     data: {
  //                       compToWin: !nextCompetition
  //                         ? updatedAffiliation.competitionId
  //                         : nextCompetition?.id,
  //                     },
  //                   });
  //                   await emailSender({
  //                     from: 'noreply@winuwatch.uk',
  //                     cc: 'admin@winuwatch.uk',
  //                     to: updatedAffiliation.ownerEmail,
  //                     subject: `Claim your free ticket - Winuwatch`,
  //                     html: '',
  //                     // html: FreeTickets({
  //                     //   tickets: Math.floor(updatedAffiliation.uses / 5),
  //                     //   nextComp: nextCompetition,
  //                     // }),
  //                     // `You won ${Math.floor(
  //                     //   updatedAffiliation.uses / 5
  //                     // )} free ${
  //                     //   Math.floor(updatedAffiliation.uses / 5) === 1
  //                     //     ? "ticket"
  //                     //     : "tickets"
  //                     // }, buy a ticket on next compition ${
  //                     //   nextCompetition?.name ?? ""
  //                     // } with ID ${nextCompetition?.id ?? ""} to claim it!`,
  //                   });
  //                 }
  //               }
  //             });
  //           } else if (!!data.order?.runUpPrizeId) {
  //             await ctx.prisma.runUpPrize.update({
  //               where: {
  //                 // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //                 id: data.order?.runUpPrizeId,
  //               },
  //               data: {
  //                 uses: {
  //                   increment: 1,
  //                 },
  //               },
  //             });
  //           }
  //           //! send new discount code to user that made the order
  //           const affiliationExist = await ctx.prisma.affiliation.findMany({
  //             where: {
  //               ownerEmail: data.order.email,
  //               competitionId: {
  //                 in: data.comps.map((e) => e.id),
  //               },
  //             },
  //           });

  //           const affiliationExistIds = new Set(
  //             affiliationExist.map((e) => e.competitionId),
  //           );

  //           for (const comp of data.comps) {
  //             if (!affiliationExistIds.has(comp.id)) {
  //               const newAffiliation = await ctx.prisma.affiliation.create({
  //                 data: {
  //                   ownerEmail: data.order.email,
  //                   discountCode: await discountCodeGenerator(ctx.prisma),
  //                   competitionId: comp.id,
  //                 },
  //               });
  //               comp.affiliationCode = newAffiliation.discountCode;
  //             } else {
  //               for (const affiliation of affiliationExist) {
  //                 if (comp.id === affiliation.competitionId) {
  //                   comp.affiliationCode = affiliation.discountCode;
  //                   break;
  //                 }
  //               }
  //             }
  //             if (data.order?.affiliationId) {
  //               const affiliation = await ctx.prisma.affiliation.findUnique({
  //                 where: {
  //                   id: data.order?.affiliationId,
  //                 },
  //               });
  //               if (affiliation && affiliation.competitionId === comp.id) {
  //                 comp.affiliationRate = affiliation.discountAmount
  //                   ? affiliation.discountAmount / comp.ticket_price
  //                   : affiliation.discountRate;
  //               } else {
  //                 comp.affiliationRate = 0;
  //               }
  //             } else {
  //               comp.affiliationRate = 0;
  //             }
  //           }

  //           console.log('COMPS ====>', data.comps);

  //           await emailSender({
  //             from: 'noreply@winuwatch.uk',
  //             cc: 'admin@winuwatch.uk',

  //             to: data.order.email,
  //             subject: `Order Confirmation - Winuwatch #${
  //               data.order?.id ?? '000000'
  //             }`,
  //             html: '', //Email(data),
  //           });
  //           return data.order;
  //         } else {
  //           return;
  //         }
  //       } catch (error) {
  //         console.log(error);
  //         throw new TRPCError({
  //           code: 'INTERNAL_SERVER_ERROR',
  //           message: 'Internal server error',
  //           cause: error,
  //         });
  //       }
  //     }),
  getNextComp: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const nextCompetition = await ctx.prisma.competition.findFirst({
        where: {
          id: {
            not: input,
          },
          status: 'ACTIVE',
        },
        orderBy: {
          end_date: 'asc',
        },
        include: {
          Watches: {
            include: {
              images_url: true,
            },
          },
        },
      });
      return nextCompetition;
    }),
  updateEmail: protectedProcedure
    .input(z.object({ id: z.string(), new_email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.order.update({
          where: {
            id: input.id,
          },
          data: {
            email: input.new_email,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          cause: error,
        });
      }
    }),
  sendEmail: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const data = await GetData(input, ctx.prisma);
      const comp = await ctx.prisma.competition.findUnique({
        where: {
          id: data.comps[0]?.id,
        },
        select: {
          id: true,
          total_tickets: true,
          name: true,
          end_date: true,
          price: true,
          ticket_price: true,
          remaining_tickets: true,
          status: true,
          max_winners: true,
          cash_alternative: true,
          Watches: {
            include: {
              images_url: true,
            },
          },
          _count: {
            select: {
              Ticket: true,
            },
          },
        },
      });
      const referral = ctx.session?.user.id
        ? await ctx.prisma.referrals.findFirst({
            where: {
              user_id: ctx.session.user.id,
            },
          })
        : null;
      if (!data.order || !comp) {
        throw new Error('Order not found');
      }
      //had to add this to fit in the type and its urgent

      // await emailSender({
      //   from: 'noreply@winuwatch.uk',
      //   cc: 'admin@winuwatch.uk',

      //   to: data.order.email,
      //   subject: `Order Confirmation - Winuwatch #${
      //     data.order?.id ?? '000000'
      //   }`,
      //   html: '', //Email(data),
      // });
      await sendConfirmationEmail({
        identifier: data.order.email,
        order_id: data.order.id,
        competition: comp,
        buyer_name: `${data.order.first_name} ${data.order.last_name}`,
        paymentMethod: data.order.paymentMethod,
      });
      return true;
    }),

  // updatePaypalOrder: protectedProcedure
  //   .input(CreateOrderStripeSchema)
  //   .mutation(async ({ ctx, input }) => {
  //     const {
  //       locale,
  //       comps,
  //       affiliationId = null,
  //       runUpPrizeId = null,
  //       ...data
  //     } = input;
  //     await ctx.prisma.order.update({
  //       where: {
  //         id: input.id,
  //       },
  //       data: {
  //         ...data,
  //         affiliationId: affiliationId,
  //         runUpPrizeId: runUpPrizeId,
  //         status: order_status.PENDING,
  //       },
  //     });
  //     return true;
  //   }),

  // createStripe: publicProcedure
  //   .input(CreateOrderStripeSchema)
  //   .mutation(async ({ ctx, input }) => {
  //     try {
  //       const {
  //         locale,
  //         comps,
  //         affiliationId = null,
  //         runUpPrizeId = null,
  //         ...data
  //       } = input;
  //       const [Order, StripeOrder] = await Promise.all([
  //         ctx.prisma.order.update({
  //           where: {
  //             id: input.id,
  //           },
  //           data: {
  //             ...data,
  //             affiliationId: affiliationId,
  //             runUpPrizeId: runUpPrizeId,
  //             status: order_status.PENDING,
  //           },
  //         }),
  //         await Stripe.checkout.sessions.create({
  //           payment_method_types: ['card'],
  //           mode: 'payment',
  //           customer_email: data.email,
  //           //locale: locale === 'il' ? 'auto' : locale,
  //           locale: 'auto',
  //           line_items: (
  //             await ctx.prisma.competition.findMany({
  //               where: {
  //                 id: {
  //                   in: comps.map(({ compID }) => compID),
  //                 },
  //               },
  //               include: {
  //                 Watches: {
  //                   include: {
  //                     images_url: true,
  //                   },
  //                 },
  //               },
  //             })
  //           ).map((comp) =>
  //             comp.Watches
  //               ? {
  //                   price_data: {
  //                     currency: 'gbp',
  //                     product_data: {
  //                       name: comp.Watches.model,
  //                       images: comp.Watches.images_url.map(({ url }) => url),
  //                     },
  //                     unit_amount: Math.floor(
  //                       100 *
  //                         (!runUpPrizeId
  //                           ? comp.ticket_price *
  //                             (1 -
  //                               (input.comps.find(
  //                                 ({ compID }) => compID === comp.id,
  //                               )?.reduction ?? 0))
  //                           : comp.ticket_price -
  //                             (input.comps.find(
  //                               ({ compID }) => compID === comp.id,
  //                             )?.reduction ?? 0)),
  //                     ),
  //                   },
  //                   quantity:
  //                     input.comps.find((item) => item.compID === comp.id)
  //                       ?.number_tickets ?? 0,
  //                 }
  //               : {},
  //           ),
  //           success_url: `${getBaseUrl()}${
  //             locale && `/${locale}`
  //           }/Confirmation/${input.id}`,
  //           cancel_url: `${getBaseUrl()}${locale && `/${locale}`}/Cancel/${
  //             input.id
  //           }`,
  //         }),
  //       ]);

  //       await ctx.prisma.order.update({
  //         where: {
  //           id: Order.id,
  //         },
  //         data: {
  //           paymentId: StripeOrder.id,
  //         },
  //       });

  //       return {
  //         url: StripeOrder.url,
  //       };
  //     } catch (e) {
  //       console.error(e);
  //       return {
  //         error: 'Error in creating the order',
  //         url: null,
  //       };
  //     }
  //   }),
  // validatePaypal: publicProcedure.input(z.object({paypal: z.object({}), id: z.string()})).mutation(async ({ctx,input}) => {
  // input.paypal.order.capture()
  // await ctx.prisma.order.update({
  //   where: {
  //     id: input.id,
  //   },
  //   data: {
  //     status: order_status.CONFIRMED,
  //   },
  // });

  // }),
  // createOrder: publicProcedure
  //   .input(CreateOrderFromCartSchema)
  //   .mutation(async ({ ctx, input }) => {
  //     const id = faker.datatype.uuid();
  //     const order = await ctx.prisma.order.create({
  //       data: {
  //         address: '',
  //         checkedEmail: false,
  //         country: '',
  //         date: new Date(),
  //         first_name: '',
  //         last_name: '',
  //         town: '',
  //         zip: '',
  //         phone: '',
  //         email: '',
  //         paymentMethod: 'STRIPE',
  //         checkedTerms: false,
  //         totalPrice: 0,
  //         id,
  //         status: order_status.INCOMPLETE,
  //         Ticket: {
  //           createMany: {
  //             data: [], //TODO: I think we should assign the tickets here, but I need to double check if All the calulations are done with the status of order being "INCOMPLETE"
  //           },
  //         },
  //       },
  //     });
  //     return order.id;
  //   }),
  // createOrderNew: publicProcedure
  //   .input(CreateOrderSchema)
  //   .mutation(async ({ ctx, input }) => {
  //     const id = faker.string.uuid();
  //     const { comps, gift, ...data } = input;
  //     const bought_tickets = comps[0]?.number_tickets;
  //     try {
  //       if (!bought_tickets) {
  //         throw new TRPCError({
  //           code: 'BAD_REQUEST',
  //           message: `Tickets number cannot be null`,
  //         });
  //       }
  //       // Verify if coupon already used with this email (non logged users)
  //       if (data.coupon && !ctx.session) {
  //         const isCouponAlreadyUsed = await ctx.prisma.order.findFirst({
  //           where: {
  //             coupon: data.coupon,
  //             email: data.email,
  //           },
  //         });
  //         if (isCouponAlreadyUsed) {
  //           throw new TRPCError({
  //             code: 'BAD_REQUEST',
  //             message: 'Coupon already used by this email',
  //           });
  //         }
  //       }
  //       // Verify if order tickets are less than remaining tickets in competition
  //       const [TicketSoldquery, comp] = await Promise.all([
  //         ctx.prisma.$queryRaw<
  //           Array<{
  //             SoldTickets: bigint;
  //           }>
  //         >`
  //         SELECT COUNT(*) as SoldTickets
  //         FROM tickets
  //         JOIN \`order\` ON tickets.orderId = \`order\`.id
  //         WHERE \`order\`.status = 'confirmed' AND competitionId =${comps[0]?.compID};`,
  //         ctx.prisma.competition.findFirst({
  //           where: {
  //             id: comps[0]?.compID,
  //           },
  //           select: {
  //             total_tickets: true,
  //           },
  //         }),
  //       ]);
  //       const SoldTickets = TicketSoldquery[0]?.SoldTickets ?? 0;
  //       if (!comp) {
  //         throw new TRPCError({
  //           code: 'BAD_REQUEST',
  //           message: 'Competition not found',
  //         });
  //       }
  //       const remaining_tickets = comp.total_tickets - Number(SoldTickets);
  //       if (remaining_tickets === 0 || remaining_tickets < bought_tickets) {
  //         console.log(
  //           '🚀 ~ .mutation ~ if (remaining_tickets === 0 || remaining_tickets < bought_tickets):\t',
  //           remaining_tickets === 0 || remaining_tickets < bought_tickets,
  //         );
  //         throw new TRPCError({
  //           code: 'BAD_REQUEST',
  //           message: `Tickets are sold out`,
  //         });
  //       }
  //       // ENDOF Verification
  //       const order = await ctx.prisma.order.create({
  //         data: {
  //           id: id,
  //           ...data,
  //           status: order_status.INCOMPLETE,
  //           Ticket: {
  //             createMany: {
  //               data: comps
  //                 .map(
  //                   ({
  //                     compID,
  //                     number_tickets,
  //                     price_per_ticket,
  //                     reduction,
  //                     affiliation_reduction,
  //                   }) =>
  //                     new Array(number_tickets).fill(0).map((_) => ({
  //                       competitionId: compID,
  //                       ticketPrice: price_per_ticket,
  //                       reduction: reduction,
  //                       affiliation_reduction: affiliation_reduction,
  //                     })),
  //                 )
  //                 .flat(),
  //             },
  //           },
  //         },
  //       });
  //       if (gift) {
  //         console.log('gift exists orderid : ', order.id, 'gift', gift);
  //         const addGift = await ctx.prisma.gift.create({
  //           data: {
  //             order_id: order.id,
  //             email: data.email,
  //             message: gift.message,
  //             fullname: data.first_name + ' ' + data.last_name,
  //           },
  //         });
  //       }
  //       return order.id;
  //     } catch (error) {
  //       if (error instanceof TRPCError) {
  //         throw error;
  //       } else {
  //         throw new TRPCError({
  //           code: 'INTERNAL_SERVER_ERROR',
  //           message: 'Something went wrong',
  //           cause: error,
  //         });
  //       }
  //     }
  //   }),
  // create: publicProcedure
  //   .input(CreateOrderSchema)
  //   .mutation(async ({ ctx, input }) => {
  //     const { comps, ...data } = input;
  //     return await ctx.prisma.order.create({
  //       data: {
  //         ...data,
  //         status: order_status.CONFIRMED,
  //         Ticket: {
  //           createMany: {
  //             data: comps
  //               .map(({ compID, number_tickets }) =>
  //                 new Array(number_tickets).fill(0).map((_) => ({
  //                   competitionId: compID,
  //                 })),
  //               )
  //               .flat(),
  //           },
  //         },
  //       },
  //     });
  //   }),
  pendingOrder: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.order.update({
        where: {
          id: input,
        },
        data: {
          status: order_status.PENDING,
        },
      });
    }),
  update: protectedProcedure
    .input(
      CreateOrderSchema.extend({
        status: z.nativeEnum(order_status),
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      return await ctx.prisma.order.update({
        data: input,
        where: {
          id,
        },
      });
    }),
  // updateStatus: publicProcedure
  //   .input(
  //     z.object({
  //       id: z.string(),
  //       status: z.nativeEnum(order_status),
  //       paymentId: z.string().optional(),
  //       tickets_number: z.number(),
  //       competition_id: z.string(),
  //       coupon: z.string().optional(),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     try {
  //       const order = await ctx.prisma.$transaction([
  //         //update order status
  //         ctx.prisma.order.update({
  //           where: {
  //             id: input.id,
  //           },
  //           data: {
  //             status: input.status,
  //             paymentId: input.paymentId,
  //           },
  //         }),
  //         //decrement remaining tickets of the competition
  //         ctx.prisma.competition.update({
  //           where: {
  //             id: input.competition_id,
  //           },
  //           data: {
  //             remaining_tickets: {
  //               decrement: input.tickets_number,
  //             },
  //           },
  //         }),
  //       ]);
  //       //ADD wincoins
  //       if (ctx.session) {
  //         const userId = ctx.session.user.id;

  //         // Fetch the user's current wincoin balance
  //         const user = await ctx.prisma.user.findUnique({
  //           select: { wincoin: true },
  //           where: { id: userId },
  //         });

  //         const MAX_WINCOINS = 100;
  //         const WINCOINS_PER_TICKET = 10;
  //         const ticketsCount = input.tickets_number ?? 0;

  //         // Only proceed if the user has less than MAX_WINCOINS.
  //         if (user && user.wincoin < MAX_WINCOINS) {
  //           // Update the user's wincoin balance, so it does not exceed MAX_WINCOINS "100".
  //           const update = await ctx.prisma.user.update({
  //             data: {
  //               wincoin: Math.min(
  //                 user.wincoin + ticketsCount * WINCOINS_PER_TICKET,
  //                 MAX_WINCOINS,
  //               ),
  //             },
  //             where: { id: userId },
  //           });
  //           console.log('updating wincoins', update);
  //         }
  //       }
  //       // ADD wincoins to coupon owner and increment coupon usage
  //       console.log('should enter wincoin add to coupon owner now');
  //       if (input.coupon) {
  //         console.log('user inserted this coupon', input.coupon);
  //         //get Coupon data
  //         const coupon = await ctx.prisma.referrals.findUnique({
  //           where: {
  //             code: input.coupon,
  //           },
  //         });
  //         //get Coupon Owner Data
  //         const coupon_owner = await ctx.prisma.user.findUnique({
  //           where: {
  //             id: coupon?.user_id,
  //           },
  //         });
  //         console.log(`the coupon owner is ${coupon_owner?.email}`);
  //         // Verifying if coupon holder already has above 100 wincoins to prevent entering the bloc for useless fetching in this case
  //         if (coupon_owner && coupon_owner.wincoin < 100) {
  //           console.log(`coupon owner has ${coupon_owner.wincoin} wincoins`);
  //           //increment coupon usage
  //           await ctx.prisma.$transaction([
  //             //increment coupon usage
  //             ctx.prisma.referrals.update({
  //               where: {
  //                 code: input.coupon,
  //               },
  //               data: {
  //                 usage_counter: {
  //                   increment: 1,
  //                 },
  //               },
  //             }),
  //             //ADD wincoins to coupon owner
  //             ctx.prisma.user.update({
  //               where: {
  //                 id: coupon?.user_id,
  //               },
  //               data: {
  //                 //Math.min to prevent any unexpected behavior, even though this bloc runs only if wincoins < 100 , u never know
  //                 wincoin: Math.min(coupon_owner.wincoin + 10, 100),
  //               },
  //             }),
  //           ]);
  //         }
  //       }
  //     } catch (error) {
  //       return { error };
  //     }
  //   }),
  removeTickets: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.ticket.deleteMany({
        where: {
          orderId: input,
        },
      });
    }),
  remove: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.ticket.deleteMany({
        where: {
          orderId: input,
        },
      });
      return await ctx.prisma.order.delete({
        where: {
          id: input,
        },
      });
    }),
});
