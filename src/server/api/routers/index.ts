/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import Email, { GetData } from "@/components/emails";
// import FreeTickets from "@/components/emails/FreeTickets";
// import RemainingEmail from "@/components/emails/RemainingEmail";
// import RunerUp from "@/components/emails/RunerUp";
// import RunerUp2 from "@/components/emails/RunerUp2";
// import WinningEmail, { GetWinnerData } from "@/components/emails/WinningEmail";
// import EmailF from "@/components/emailsFree";
// import { default as NewsLetter, default as newsLetter1 } from "@/components/newsLetter1";
// import { Stripe } from '@/lib/stripe';
import { sendWinnerEmail } from '@/lib/sendWinnerEmail';
import { CompetitionSchema, WatchesSchema } from '@/lib/zodSchemas';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/api/trpc';
import {
  Prisma,
  type Competition,
  type PrismaClient,
  type Watches,
} from '@prisma/client';
import {
  CompetitionStatus,
  order_paymentMethod,
  order_status,
} from '@/lib/prisma-enums';
import { TRPCError } from '@trpc/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { type CompetitionData } from '../../utils';

export const GetWinnerData = async (
  TicketID: string,
  prismaClient: PrismaClient,
) => {
  const data = await prismaClient.ticket.findUnique({
    where: {
      id: TicketID,
    },
    include: {
      Order: true,
      Competition: {
        include: {
          Watches: {
            include: {
              images_url: true,
            },
          },
        },
      },
    },
  });

  return {
    data,
  };
};

export const GetData = async (OrderID: string, prismaClient: PrismaClient) => {
  const [order, comps] = await Promise.all([
    prismaClient.order.findUnique({
      where: {
        id: OrderID,
      },
    }),
    prismaClient.competition.findMany({
      include: {
        Ticket: {
          where: {
            orderId: OrderID,
          },
        },
        Watches: {
          include: {
            images_url: true,
          },
        },
      },
    }),
  ]);

  return {
    order,
    comps: comps
      .filter(({ Ticket }) => Ticket.length > 0)
      .map((comp) => ({
        ...comp,
        affiliationCode: '',
        affiliationRate: 0,
      })),
  };
};
const Months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const discountCodeGenerator = async (
  prisma: PrismaClient,
): Promise<string> => {
  const possible =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
  let attempts = 0;
  while (attempts < 20) {
    // limit the number of attempts to 10
    const coupon = Array.from(
      { length: 10 },
      () => possible[Math.floor(Math.random() * possible.length)],
    ).join('');
    const [affExists, rupExists] = await Promise.all([
      prisma.affiliation.count({
        where: {
          discountCode: coupon,
        },
      }),
      prisma.runUpPrize.count({
        where: {
          couponCode: coupon,
        },
      }),
    ]);
    if (affExists + rupExists === 0) {
      return coupon;
    }
    attempts++;
  }
  throw new Error(
    'Failed to generate a unique discount code after 10 attempts',
  );
};

const resend = new Resend('re_FQdpSd2S_MSmnQ5fWodGVMs5xiUZ4vZmg');

export const emailSender = async (data: {
  to: string | Array<string>;
  from: string;
  subject: string;
  cc?: string | Array<string>;
  html: string;
}) => await resend.emails.send(data);

export const WinnersRouter = createTRPCRouter({
  getCSV: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const competition = await ctx.prisma.competition.findUnique({
        where: {
          id: input,
        },
        include: {
          Ticket: {
            include: {
              Order: true,
            },
            where: {
              Order: {
                status: order_status.CONFIRMED, // Only include tickets with confirmed orders
              },
            },
          },
        },
      });

      if (!competition) {
        throw new Error('Competition not found');
      }

      return competition.Ticket.map((ticket) => ({
        ticketID: ticket.id,
        Order_ID: ticket.Order.id,
        first_name: ticket.Order.first_name,
        last_name: ticket.Order.last_name,
      }));
    }),
  // pickOneRandom: publicProcedure
  //   .input(z.string())
  //   .mutation(async ({ ctx, input }) => {
  //     //based on the competition id, pick a random winner and return the ticket data and order data

  //     const tickets = await ctx.prisma.ticket.findMany({
  //       where: {
  //         competitionId: input,
  //       },
  //       include: {
  //         Order: true,
  //         Competition: {
  //           include: {
  //             Watches: {
  //               include: {
  //                 images_url: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });
  //     const random = Math.floor(Math.random() * tickets.length); // This algo neeeds to change
  //     return tickets[random] ?? tickets[0];
  //   }),
  getWinner: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const winner = await ctx.prisma.ticket.findUnique({
        where: {
          id: input,
        },
        include: {
          Order: true,
          Competition: true,
        },
      });
      return winner;
    }),
  sendNewsLetters: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      //based on the ticket ID we should be able to close the competition and send the winner an email
      const orders = await ctx.prisma.ticket.findMany({
        where: {
          Order: {
            checkedEmail: true,
          },
          competitionId: input,
        },
        include: {
          Order: true,
          Competition: {
            include: {
              Watches: {
                include: {
                  images_url: true,
                },
              },
            },
          },
        },
      });
      if (!orders) {
        throw new Error('Competition not found');
      }
      // change to getWinnerdata

      orders
        .filter(
          (order, index) =>
            index ===
            orders.findIndex((o) => order.Order.email === o.Order.email),
        )
        .map(async (order) => {
          console.log('sent');
          // const data = { data: order };
          await emailSender({
            from: 'noreply@winuwatch.uk',
            to: order.Order.email,
            subject: `NewsLetter Email - Winuwatch ${
              order.Competition.name ?? '000000'
            }`,
            html: '', //newsLetter1(data),
          });
        });
      return void 0; //TODO : Send email
    }),
  confirmWinner: protectedProcedure
    .input(
      z
        .object({
          compId: z.string(),
          winner: z.string(),
          orderId: z.string(),
          ticketId: z.string(),
        })
        .required(),
    )
    .mutation(async ({ ctx, input }) => {
      //based on the ticket ID we should be able to close the competition and send the winner an email
      const ticket = await ctx.prisma.competition.update({
        where: {
          id: input.compId,
        },
        data: {
          winner: input.winner,
        },
      });
      if (!ticket) {
        throw new Error('Competition not found');
      }

      const { data } = await GetWinnerData(input.ticketId, ctx.prisma);
      if (!data?.Order) {
        throw new Error('Order not found');
      }
      console.log('will send now');
      await sendWinnerEmail({ order_id: data.orderId });
      /*
      const { Order, Competition } = ticket;
      const { Watches } = Competition;
      const { email } = Order;
      */
      return void 0; //TODO : Send email
    }),
  sendConfirmation: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const data = await GetWinnerData(input, ctx.prisma);
      if (!data?.data?.Order) {
        throw new Error('Order not found');
      }
      await emailSender({
        from: 'noreply@winuwatch.uk',
        cc: 'admin@winuwatch.uk',
        to: data?.data?.Order.email,
        subject: `Congratulations - Winuwatch #${
          data?.data?.orderId ?? '000000'
        }`,
        html: '', //WinningEmail(data),
      });
      return void 0;
    }),
  getWinnerReminders: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const competition = await ctx.prisma.ticket.findMany({
        where: {
          competitionId: input,
          Order: {
            status: order_status.CONFIRMED,
          },
        },
        include: {
          Order: true,
          Competition: {
            include: {
              Watches: {
                include: {
                  images_url: true,
                },
              },
            },
          },
        },
      });

      if (!competition) {
        throw new Error('Competition not found');
      }
      competition
        .filter(
          (order, index) =>
            index ===
            competition.findIndex((o) => order.Order.email === o.Order.email),
        )
        .map(async (order) => {
          console.log('sent');

          // const data = { data: order };
          await emailSender({
            cc: 'admin@winuwatch.uk',
            from: 'noreply@winuwatch.uk',
            to: order.Order.email,
            subject: `Reminder Email - Winuwatch #${order.orderId ?? '000000'}`,
            html: '', //RemainingEmail(data),
          });
          return void 0;
        });
      return void 0;
    }),
});

export const TicketsRouter = createTRPCRouter({
  getTicket: protectedProcedure.input(z.string().optional()).query(
    async ({ ctx, input }) =>
      await ctx.prisma.ticket.findUniqueOrThrow({
        where: {
          id: input,
        },
        include: {
          Competition: true,
          Order: true,
        },
      }),
  ),

  getTicketsByOrderId: publicProcedure.input(z.string()).query(
    async ({ ctx, input }) =>
      await ctx.prisma.ticket.findMany({
        where: {
          orderId: input,
        },
      }),
  ),
});

// export const AuthRouter = createTRPCRouter({
//   auth: publicProcedure
//     .input(z.object({ username: z.string(), password: z.string() }))
//     .mutation(
//       ({ input }) =>
//         input.username === 'admin' && input.password === env.ADMIN_PASSWORD,
//     ),
// });

export const CompetitionRouter = createTRPCRouter({
  removeWinningWatchImage: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const data = await ctx.prisma.competition.update({
        where: {
          id: input,
        },
        data: {
          comp_image_url: null,
        },
      });
      return data;
    }),
  getConfirmedAsCSV: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const data = await ctx.prisma.order.findMany({
        where: {
          //status: order_status.CONFIRMED,
          Ticket: {
            some: {
              competitionId: input,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return data.map((order) => ({
        competitionId: input,
        email: order.email,
        firstName: order.first_name,
        lastName: order.last_name,
        phone: order.phone,
        status: order.status,
      }));
    }),
  getAll: publicProcedure
    .input(
      z
        .object({
          ids: z.array(z.string()).optional(),
          status: z.nativeEnum(CompetitionStatus).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const Data = await ctx.prisma.$queryRaw<
        Array<
          Competition & {
            Watches: Watches;
          }
        >
      >`
          SELECT
              c.*,
              c.total_tickets - COALESCE((
                  SELECT
                      COUNT(t.id)
                  FROM
                      tickets t
                  LEFT JOIN \`order\` o ON
                      t.orderId = o.id
                  WHERE
                      o.status = 'confirmed'
                      AND c.id = t.competitionId
              ), 0) AS remaining_tickets,
              JSON_OBJECT(
                'id', w.id,
                'brand', w.brand,
                'model', w.model,
                'reference_number', w.reference_number,
                'movement', w.movement,
                'Bracelet_material', w.Bracelet_material,
                'year_of_manifacture', w.year_of_manifacture,
                'caliber_grear', w.caliber_grear,
                'number_of_stones', w.number_of_stones,
                'glass', w.glass,
                'bezel_material', w.bezel_material,
                'has_box', w.has_box,
                'has_certificate', w.has_certificate,
                'condition', w.condition,
                'createdAt', w.createdAt,
                'updatedAt', w.updatedAt
            ) AS Watches
          FROM
              competition c
          LEFT JOIN watches w 
            on c.watchesId = w.id
          ${
            input
              ? Prisma.sql`WHERE c.status = ${JSON.stringify(input.status)} ${
                  input.ids
                    ? Prisma.sql`AND c.id IN (${input.ids.map((id) => JSON.stringify(id)).join(',')})`
                    : Prisma.empty
                }`
              : Prisma.empty
          }
          ORDER BY
              c.end_date DESC;
          `;
      //Get the list of competitions to update
      const finishedComps = Data.filter(
        (comp) =>
          comp.status !== CompetitionStatus.COMPLETED &&
          comp.remaining_tickets === 0 &&
          comp.end_date < new Date(),
      ).map(({ id }) => id);

      // Update the status of the selected competitions to "COMPLETE"
      // WARNING: This triggers updatedAt field changes automatically
      if (finishedComps.length > 0) {
        await ctx.prisma.competition.updateMany({
          where: { id: { in: finishedComps } },
          data: { status: CompetitionStatus.COMPLETED },
        });
      }
      return Data.map((comp) => ({
        ...comp,
        remaining_tickets: comp.remaining_tickets.toString(),
        start_date: new Date(comp.start_date),
        end_date: new Date(comp.end_date),
        drawing_date: new Date(comp.drawing_date),
        createdAt: new Date(comp.createdAt),
      }));
    }),
  //GetUniqueByID
  GetUniqueByID: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const Data = await ctx.prisma.$transaction([
        ctx.prisma.competition.findUnique({
          where: {
            id: input,
          },
          select: {
            id: true,
            _count: {
              select: {
                Ticket: true,
              },
            },
          },
        }),
        ctx.prisma.competition.findUnique({
          where: {
            id: input,
          },
          include: {
            Watches: {
              include: {
                images_url: true,
              },
            },
          },
        }),
      ]);
      return Data[1] && Data[0]
        ? {
            ...Data[1],
            remaining_tickets: Data[1]?.total_tickets - Data[0]?._count?.Ticket,
          }
        : undefined;
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return (await ctx.prisma.competition.delete({
      where: {
        id: input,
      },
    }))
      ? {
          success: true,
        }
      : {
          success: false,
          error: 'Competition not found',
        };
  }),
  byID: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const Data = await ctx.prisma.$transaction([
      ctx.prisma.competition.findUnique({
        where: {
          id: input,
        },
        select: {
          id: true,
          _count: {
            select: {
              Ticket: true,
            },
          },
        },
      }),
      ctx.prisma.competition.findUnique({
        where: {
          id: input,
        },
        include: {
          Watches: {
            include: {
              images_url: true,
            },
          },
        },
      }),
    ]);
    return Data[1]
      ? {
          ...Data[1],
          remaining_tickets:
            Data[1].total_tickets - (Data[0]?._count?.Ticket ?? 0),
        }
      : undefined;
  }),
  updateOne: publicProcedure
    .input(
      CompetitionSchema.omit({
        remaining_tickets: true,
      }).extend({
        watchesId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.competition.update({
        data,
        where: {
          id,
        },
      });
    }),
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(CompetitionStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;
      return await ctx.prisma.competition.updateMany({
        where: {
          id,
        },
        data: {
          status: status,
        },
      });
    }),

  add: publicProcedure
    .input(
      CompetitionSchema.omit({ id: true, remaining_tickets: true }).required(),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.competition.create({
        data: {
          ...input,
          remaining_tickets: input.total_tickets,
        },
      });
    }),
});

export const WatchesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return (
      await ctx.prisma.watches.findMany({
        include: {
          images_url: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    ).map((watch) => ({
      ...watch,
      images_url: watch.images_url.map((image) => image.url),
    }));
  }),
  byID: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.watches.findUnique({
        where: {
          id: input.id,
        },
        include: {
          images_url: true,
        },
      });
    }),
  remove: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    //TODO: Delete the images from firebase
    await ctx.prisma.imagesUrl.deleteMany({
      where: {
        WatchesId: input,
      },
    });
    return await ctx.prisma.watches.delete({
      where: {
        id: input,
      },
    });
  }),
  removeWatchIMG: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      //TODO: Delete the images from firebase
      await ctx.prisma.imagesUrl.deleteMany({
        where: {
          url: input,
        },
      });
    }),
  addWatchIMG: publicProcedure
    .input(
      z.object({
        WatchesId: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.imagesUrl.create({
        data: {
          ...input,
        },
      });
    }),

  add: publicProcedure
    .input(
      WatchesSchema.omit({
        id: true,
      }).extend({
        images_url: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { images_url, ...data } = input;
      return await ctx.prisma.watches.create({
        data: {
          ...data,
          images_url: {
            create: images_url.map((url) => ({ url })),
          },
        },
      });
    }),

  update: publicProcedure
    .input(
      WatchesSchema.extend({
        images_url: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, images_url, ...data } = input;
      return await ctx.prisma.watches.update({
        data: {
          ...data,
          images_url: {
            create: images_url?.map((url) => ({ url })),
          },
        },
        where: {
          id,
        },
      });
    }),

  /*
  add: publicProcedure
    .input(
      z.object({
        name: z.string(),
        owner_ref: z.string().optional(),
        condition: z.string(),
        years: z.number(),
        movement: z.string(),
        case_size: z.number(),
        dail: z.string(),
        case_material: z.string(),
        bracelet_material: z.string(),
        water_proof: z.string(),
        box: z.boolean().default(false),
        papers: z.boolean().default(false),
        imageURL: z.array(z.string()),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.watches.create({
        data: input,
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        owner_ref: z.string().optional(),
        condition: z.string().optional(),
        years: z.number().optional(),
        movement: z.string().optional(),
        case_size: z.number().optional(),
        dail: z.string().optional(),
        case_material: z.string().optional(),
        bracelet_material: z.string().optional(),
        water_proof: z.string().optional(),
        box: z.boolean().optional(),
        papers: z.boolean().optional(),
        imageURL: z.array(z.string()),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.watches.update({
        data,
        where: { id },
      });
    }),
  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.watches.delete({
        where: {
          id: input.id,
        },
      });
    }),
    */
});

export const QuestionRouter = createTRPCRouter({
  getOneRandom: publicProcedure.query(async ({ ctx }) => {
    const Questions = await ctx.prisma.question.findMany({
      include: {
        answers: true,
      },
    });
    const randomIndex = Math.floor(Math.random() * Questions.length);
    const Question =
      randomIndex < Questions.length && randomIndex >= 0
        ? Questions[randomIndex]
        : Questions[0];
    if (!Question) {
      return null;
    }
    return {
      ...Question,
      answers:
        ((array: (string | undefined)[]) => {
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
          return array.filter(
            (item): item is string => typeof item === 'string',
          );
        })(Question.answers.map(({ answer }) => answer)) ?? [],
    };
  }),
});

export const AffiliationRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      //Adding ssr pagination
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 10;
      const skip = (page - 1) * pageSize;
      try {
        const affiliations = await ctx.prisma.affiliation.findMany({
          skip: skip,
          take: pageSize,
          include: {
            competition: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        const total = await ctx.prisma.affiliation.count();
        const totalPages = Math.ceil(total / pageSize);

        return {
          data: affiliations,
          pagination: {
            total,
            totalPages,
            currentPage: page,
            pageSize,
          },
        };
      } catch (error) {
        console.log(error);
        return [];
      }
    }),

  add: publicProcedure
    .input(
      z.object({
        discountRate: z.number().gte(0).lte(100).default(0),
        discountAmount: z.number().gte(0).default(0),
        ownerEmail: z.string().email(),
        competitionId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.discountRate == 0 && input.discountAmount == 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Discount rate or discount amount must be greater than 0',
          });
        }
        const hasAffiliation = await ctx.prisma.affiliation.findFirst({
          where: {
            competitionId: input.competitionId,
            ownerEmail: input.ownerEmail,
          },
        });
        if (hasAffiliation) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Affiliation already exists',
          });
        }
        const competition = await ctx.prisma.competition.findUnique({
          where: {
            id: input.competitionId,
          },
          include: {
            Ticket: {
              include: {
                Order: true,
              },
            },
          },
        });
        if (
          competition?.Ticket[0]?.Order?.totalPrice &&
          input.discountAmount >= competition?.Ticket[0]?.Order?.totalPrice
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Discount amount must be less than total price',
          });
        }
        return await ctx.prisma.affiliation.create({
          data: {
            ...input,
            discountRate: input.discountRate / 100,
            discountAmount: input.discountAmount ?? 0,
            discountCode: await discountCodeGenerator(ctx.prisma),
          },
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        } else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
            cause: error,
          });
        }
      }
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        discountRate: z.number().gte(0).lte(100).optional(),
        discountAmount: z.number().gte(0).optional(),
        ownerEmail: z.string().email().optional(),
        competitionId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        if (data.discountRate) {
          data.discountRate = data.discountRate / 100;
        }
        if (data.ownerEmail) {
          console.log(data);

          const hasAffiliation = await ctx.prisma.affiliation.findFirst({
            where: {
              competitionId: data.competitionId,
              ownerEmail: data.ownerEmail,
              id: {
                not: id,
              },
            },
          });
          console.log(hasAffiliation);

          if (hasAffiliation) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'User already has affiliation on this competition',
            });
          }
        }
        // if (data.discountAmount) {
        //   const competition = await ctx.prisma.competition.findUnique({
        //     where: {
        //       id: input.competitionId,
        //     },
        //     include: {
        //       Ticket: {
        //         include: {
        //           Order: true,
        //         },
        //       },
        //     },
        //   });
        //   if (
        //     competition?.Ticket[0]?.Order?.totalPrice &&
        //     input.discountAmount >= competition?.Ticket[0]?.Order?.totalPrice
        //   ) {
        //     throw new TRPCError({
        //       code: "BAD_REQUEST",
        //       message: "Discount amount must be less than total price",
        //     });
        //   }
        // }
        return await ctx.prisma.affiliation.update({
          data,
          where: { id },
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        } else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
            cause: error,
          });
        }
      }
    }),
  delete: publicProcedure
    .input(z.string().min(1))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.affiliation.delete({
        where: {
          id: input,
        },
      });
    }),
  checkDiscount: publicProcedure
    .input(
      z.object({
        discountCode: z.string(),
        competitionIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { discountCode, competitionIds } = input;

      if (!discountCode) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Enter your discount code',
        });
      }

      const [affiliation, runUpPrize] = await Promise.all([
        ctx.prisma.affiliation.findFirst({
          where: {
            discountCode,
            competitionId: { in: competitionIds },
          },
        }),
        ctx.prisma.runUpPrize.findFirst({
          where: {
            couponCode: discountCode,
          },
          include: {
            ticket: {
              include: {
                Competition: true,
                Order: true,
              },
            },
          },
        }),
      ]);

      if (!affiliation && !runUpPrize) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid discount code',
        });
      }

      let nextCompetition: Competition | null = null;
      if (runUpPrize) {
        if (runUpPrize.uses === runUpPrize.maxUsage) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Discount code has reached its limit of usage',
          });
        }
        nextCompetition = await ctx.prisma.competition.findFirst({
          where: {
            start_date: {
              gt: runUpPrize.ticket.Competition.start_date,
            },
          },
        });
        console.log(nextCompetition);

        if (
          !nextCompetition ||
          !input.competitionIds.includes(nextCompetition?.id ?? '')
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Discount code is not valid for this competition',
          });
        }
      }

      return affiliation
        ? {
            ...affiliation,
            isRunUpPrize: false,
          }
        : {
            id: runUpPrize?.id ?? '',
            competitionId: nextCompetition?.id ?? '',
            discountRate:
              Number(runUpPrize?.ticket.Competition.run_up_prize) ?? 0,
            discountAmount: 0,
            discountCode: runUpPrize?.couponCode ?? '',
            isRunUpPrize: true,
          };
    }),
});

export const ChartsRouter = createTRPCRouter({
  getStripePaymentSplits: publicProcedure
    .input(z.number().int().min(1).max(90).optional())
    .query(async ({ ctx, input }) => {
      const periodDays = input ?? 7;
      const since = new Date();
      since.setDate(since.getDate() - periodDays);

      const splitMethods = [
        order_paymentMethod.STRIPE,
        order_paymentMethod.VOUCH_LAB,
        order_paymentMethod.TWELVE,
      ] as const;

      const grouped = await ctx.prisma.order.groupBy({
        by: ['paymentMethod'],
        _count: {
          _all: true,
        },
        where: {
          paymentMethod: {
            in: [...splitMethods],
          },
          paymentId: {
            not: null,
          },
          createdAt: {
            gte: since,
          },
        },
      });

      const counts: Record<(typeof splitMethods)[number], number> = {
        STRIPE: 0,
        VOUCH_LAB: 0,
        TWELVE: 0,
      };

      for (const row of grouped) {
        if (row.paymentMethod in counts) {
          counts[row.paymentMethod as keyof typeof counts] = row._count._all;
        }
      }

      const total = Object.values(counts).reduce(
        (sum, value) => sum + value,
        0,
      );
      const asPercentage = (count: number) =>
        total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;

      return {
        periodDays,
        total,
        split: [
          {
            paymentMethod: order_paymentMethod.STRIPE,
            label: 'Kronograph',
            count: counts.STRIPE,
            percentage: asPercentage(counts.STRIPE),
          },
          {
            paymentMethod: order_paymentMethod.VOUCH_LAB,
            label: 'Vouch Lab',
            count: counts.VOUCH_LAB,
            percentage: asPercentage(counts.VOUCH_LAB),
          },
          {
            paymentMethod: order_paymentMethod.TWELVE,
            label: 'Twelve',
            count: counts.TWELVE,
            percentage: asPercentage(counts.TWELVE),
          },
        ],
      };
    }),
  getLastOrders: publicProcedure
    .input(z.number().optional())
    .query(async ({ ctx, input }) => {
      try {
        const data = await ctx.prisma.order.findMany({
          take: input ?? 10,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            utm: true,
            totalPrice: true,
            status: true,
            paymentMethod: true,
            phone: true,
            updatedAt: true,
            _count: {
              select: {
                Ticket: true,
              },
            },
          },
        });
        return data;
      } catch (e) {
        return [];
      }
    }),
  // get total per month for a year
  getperMonthforYear: publicProcedure
    .input(z.number().optional())
    .query(async ({ ctx, input }) => {
      const date = input ? new Date(Number(input), 0, 2) : new Date();

      const data: Array<{
        yaer: number;
        month: number;
        confirmed_total: number;
        refunded_total: number;
      }> = await ctx.prisma.$queryRaw`SELECT 
                              YEAR(m.date) AS year,
                              MONTH(m.date) AS month,
                              IFNULL(SUM(CASE WHEN o.status = 'REFUNDED' THEN o.totalPrice END), 0) AS refunded_total,
                              IFNULL(SUM(CASE WHEN o.status = 'CONFIRMED' THEN o.totalPrice END), 0) AS confirmed_total
                              FROM 
                                (
                                  SELECT 
                                    MAKEDATE(YEAR(${date}), 1) + INTERVAL (MONTHS.month - 1) MONTH AS date
                                  FROM 
                                    (SELECT 1 AS month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 
                                    UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) AS MONTHS
                                ) AS m
                                LEFT JOIN \`order\` AS o 
                                  ON YEAR(o.createdAt) = YEAR(m.date) AND MONTH(o.createdAt) = MONTH(m.date) AND o.status IN ('REFUNDED', 'CONFIRMED') 
                                  AND o.createdAt >= DATE_SUB(${date}, INTERVAL 12 MONTH) AND o.createdAt <= ${date}
                              GROUP BY 
                                YEAR(m.date), MONTH(m.date)
                              ORDER BY 
                                year ASC, month ASC
                              `;
      const result = data.map((d) => ({
        ...d,
        month: Months[d.month - 1],
        confirmed_total: Number(d.confirmed_total).toFixed(2),
        refunded_total: Number(d.refunded_total).toFixed(2),
      }));
      return result;
    }),
  // get yearly earnings for current year and previous year
  yearlyEarnings: publicProcedure.query(async ({ ctx }) => {
    // get current year and previous year total earnings
    const input = new Date();

    const data:
      | Array<{ current_year: number; last_year: number }>
      | [{ current_year: number; last_year: number }] = await ctx.prisma
      .$queryRaw`SELECT
                    IFNULL(SUM(CASE WHEN YEAR(o.createdAt) = YEAR(${input}) THEN o.totalPrice END), 0) AS current_year,
                    IFNULL(SUM(CASE WHEN YEAR(o.createdAt) = (YEAR(${input}) - 1) THEN o.totalPrice END), 0) AS last_year
                  FROM 
                      \`order\` AS o
                  WHERE 
                    o.status = 'CONFIRMED' 
                    AND YEAR(o.createdAt) >= YEAR(${input}) - 1 
                    AND YEAR(o.createdAt) <= YEAR(${input})`;
    const result: { current_year: number; last_year: number } = {
      current_year: Number(data[0].current_year.toFixed(2)) ?? 0,
      last_year: Number(data[0].last_year.toFixed(2)) ?? 0,
    };
    return result;
  }),
  // competEarnings: publicProcedure.query(async ({ ctx }) => {
  //   const data = await ctx.prisma.$queryRaw`
  // SELECT SUM(c.ticket_price) as TotalOrderValue , c.name as competitionName, c.id as competitionId
  // FROM competition c
  // INNER JOIN tickets t ON c.id = t.competitionId
  // INNER JOIN \`order\` o ON o.id = t.orderId
  // where o.status = "CONFIRMED"  AND o.paymentMethod IN ('PAYPAL', 'STRIPE')
  // GROUP BY c.name, c.id;
  // `;
  //   return data as Array<{
  //     competitionId: string;
  //     competitionName: string;
  //     TotalOrderValue: number;
  //   }>;
  // }),
  competEarnings: publicProcedure.query(async ({ ctx }) => {
    //using views for a cleaner code and better performance, you can visualize the views in the database
    const [data, data_old] = await Promise.all([
      ctx.prisma.$queryRaw<
        CompetitionData[]
      >`select * from vw_TotalAmountPerCompetition;`,
      ctx.prisma.$queryRaw<
        CompetitionData[]
      >`select * from vw_OldTotalAmountPerCompetition;`,
    ]);

    return [...data, ...data_old];
  }),

  // get total tickets sold per day for a month
  ticketSoldPerDay: publicProcedure.query(async ({ ctx }) => {
    try {
      //const date = new Date();
      //const CurrentMonth = new Date().getMonth() + 1;
      const res = (
        await ctx.prisma.$queryRaw<
          Array<{
            tickets_number: bigint;
            month: number;
            year: number;
          }>
        >`  select 
            count(*) as tickets_number, 
            MONTH(t.createdat) as month,
            YEAR(t.createdat) as year
          from tickets t
          inner join \`order\`o on(o.id = t.orderId)
          where o.status="CONFIRMED"
          and YEAR(t.createdat) = YEAR(CURDATE())
          group by MONTH(t.createdat),YEAR(t.createdat)
          ORDER BY YEAR(t.createdat),MONTH(t.createdat) DESC;
      `
      ).map((comp) => ({
        ...comp,
        total_tickets: Number(comp.tickets_number),
      }));
      return {
        totalTicketsThisMonth: res[0]?.total_tickets ?? 0,
        totalTicketsLastMonth: res[1]?.total_tickets ?? 0,
        total: res.reduce((acc, curr) => acc + curr.total_tickets, 0),
        data: [] as Array<{
          month: string;
          year: number;
          total_tickets: number;
        }>,
      };
    } catch (error) {
      console.log(error);
      return {
        totalTicketsThisMonth: 0,
        totalTicketsLastMonth: 0,
        total: 0,
        data: [] as Array<{
          month: string;
          year: number;
          total_tickets: number;
        }>,
      };
    }
  }),
  /*
      const data: Array<{
        date: string;
        total_tickets: number;
        total_orders: number;
      }> = await ctx.prisma.$queryRaw`SELECT 
                                        DATE(t.createdAt) AS date,
                                        IFNULL(COUNT(t.id), 0) AS total_tickets
                                      FROM
                                        \`tickets\` AS t
                                      WHERE
                                        t.createdAt >= DATE_SUB(${date}, INTERVAL 30 DAY)
                                        AND t.createdAt <= ${date}
                                      GROUP BY
                                        DATE(t.createdAt)
                                      ORDER BY
                                        date ASC`;

      const ticketsThisMonth: Array<{ total_tickets: number }> = await ctx
        .prisma.$queryRaw`SELECT
                            IFNULL(COUNT(t.id), 0) AS total_tickets
                          FROM
                            \`tickets\` AS t
                          WHERE
                            t.createdAt >= DATE_SUB(${date}, INTERVAL 30 DAY)
                            AND t.createdAt <= ${date}`;
      const ticketsLastMonth: Array<{ total_tickets: number }> = await ctx
        .prisma.$queryRaw`SELECT 
                            IFNULL(COUNT(t.id), 0) AS total_tickets
                          FROM
                            \`tickets\` AS t
                          WHERE
                            t.createdAt >= DATE_SUB(${date}, INTERVAL 60 DAY)
                            AND t.createdAt <= DATE_SUB(${date}, INTERVAL 30 DAY)`;
      const result = data.map((d) => ({
        month: Months[date.getMonth()],
        day: new Date(d.date).getDate(),
        total_tickets: Number(d.total_tickets),
      }));
      return {
        totalTicketsThisMonth: Number(ticketsThisMonth[0]?.total_tickets) ?? 0,
        totalTicketsLastMonth: Number(ticketsLastMonth[0]?.total_tickets) ?? 0,
        data: result,
      };
    } catch (e) {
      console.log(e);
      return { data: [], totalTicketsThisMonth: 0, totalTicketsLastMonth: 0 };
    }*/
  clientsCountry: publicProcedure.query(async ({ ctx }) => {
    try {
      const data: Array<{
        country: string;
        total: number;
      }> = await ctx.prisma.$queryRaw`SELECT 
                                        IFNULL(u.country, 'Unknown') AS country,
                                        COUNT(u.id) AS total
                                      FROM 
                                        \`order\` AS u
                                      GROUP BY 
                                        u.country
                                      ORDER BY 
                                        total DESC
                                      LIMIT 10`;
      return data;
    } catch (e) {
      console.log(e);
      return [];
    }
  }),
});

export const RunUpPrizeRouter = createTRPCRouter({
  addRunUpPrizeWinner: publicProcedure
    .input(z.object({ ticketId: z.string(), compId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const existTicket = await ctx.prisma.ticket.findUnique({
          where: {
            id: input.ticketId,
          },
          include: {
            Order: true,
            Competition: true,
          },
        });
        if (!existTicket) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Ticket not found',
          });
        }
        if (existTicket.competitionId !== input.compId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ticket does not belong to this competition',
          });
        }
        const winnersCount = await ctx.prisma.runUpPrize.count({
          where: {
            ticketId: input.ticketId,
          },
        });
        if (winnersCount >= 4) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You have reached the maximum number of winners',
          });
        }
        const addedPrize = await ctx.prisma.runUpPrize.create({
          data: {
            couponCode: await discountCodeGenerator(ctx.prisma),
            ticketId: input.ticketId,
          },
        });
        await emailSender({
          from: 'noreply@winuwatch.uk',
          cc: 'admin@winuwatch.uk',
          to: existTicket.Order?.email,
          subject: `Run Up Prize Winner - Winuwatch #${
            existTicket.Order?.id ?? '000000'
          }`,
          html: '',
          // html: RunerUp2({
          //   runUpPrize: existTicket,
          //   addedPrize: addedPrize,
          // }),
          // `You have won a run up prize for Winuwatch #${
          //   existTicket.Order?.id
          // }. Your coupon code is <b>${
          //   addedPrize.couponCode
          // }</b>. Please use this coupon code for the next competition to get a discount of £${
          //   existTicket.Competition?.run_up_prize?.toString() ?? "0"
          // }.`,
        });
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        else if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === 'P2002') {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Runner up ticket already registered',
            });
          }
        } else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
            cause: e,
          });
        }
      }
    }),
  resendEmail: publicProcedure
    .input(z.string().min(1))
    .mutation(async ({ ctx, input }) => {
      try {
        const runUpPrize = await ctx.prisma.runUpPrize.findFirst({
          where: { id: input },
          include: {
            ticket: {
              include: {
                Order: true,
                Competition: true,
              },
            },
          },
        });
        if (!runUpPrize) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Run up prize not found',
          });
        }
        await emailSender({
          from: 'noreply@winuwatch.uk',
          cc: 'admin@winuwatch.uk',
          to: runUpPrize.ticket.Order?.email,
          subject: `Run Up Prize Winner - Winuwatch #${
            runUpPrize.ticket.Order?.id ?? '000000'
          }`,
          html: '',
          // html: RunerUp({
          //   runUpPrize: runUpPrize,
          // }),
          //            `You have won a run up prize for Winuwatch #${
          //   runUpPrize.ticket.Order?.id
          // }. Your coupon code is <b>${
          //   runUpPrize.couponCode
          // }</b>. Please use this coupon code for the next competition to get a discount of £${
          //   runUpPrize.ticket.Competition?.run_up_prize?.toString() ?? "0"
          // }.`,
        });
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
            cause: e,
          });
        }
      }
    }),
  getAll: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    try {
      if (!input) return [];
      return await ctx.prisma.runUpPrize.findMany({
        where: { ticket: { Competition: { id: input } } },
        include: {
          ticket: {
            include: {
              Order: true,
              Competition: true,
            },
          },
        },
      });
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong',
        cause: e,
      });
    }
  }),
  updateRunUpPrizeWinner: publicProcedure
    .input(z.object({ id: z.string(), ticketId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.runUpPrize.update({
          where: { id: input.id },
          data: { ticketId: input.ticketId },
        });
        return { success: true };
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong',
          cause: e,
        });
      }
    }),
  deleteRunUpPrizeWinner: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.runUpPrize.delete({ where: { id: input } });
        return { success: true };
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong',
          cause: e,
        });
      }
    }),
});
