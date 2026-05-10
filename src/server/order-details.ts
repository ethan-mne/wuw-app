import { type PrismaClient } from '@prisma/client';
import { db } from '@/server/db';

export const getOrderData = async (orderId: string, prismaClient: PrismaClient = db) => {
  const [order, comps] = await Promise.all([
    prismaClient.order.findUnique({
      where: {
        id: orderId,
      },
    }),
    prismaClient.competition.findMany({
      include: {
        Ticket: {
          where: {
            orderId,
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
