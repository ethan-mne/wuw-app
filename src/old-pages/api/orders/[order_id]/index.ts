import type { NextApiRequest, NextApiResponse } from 'next';
import { db as prisma } from '@/server/db';
import { z } from 'zod';

export default async function Order(req: NextApiRequest, res: NextApiResponse) {
  // we should get the order id from the request
  let orderId = undefined;
  try {
    orderId = z.string().optional().parse(req.query.order_id);
    if (!orderId) {
      return res.status(404).json({
        error: 'Not found',
      });
    }
  } catch (error) {
    return res.status(400).json({
      error: error instanceof z.ZodError ? error.flatten() : 'error',
    });
  }

  switch (req.method) {
    case 'GET': {
      return res.json(
        await prisma.order.findUnique({
          where: {
            id: orderId,
          },
        }),
      );
    }
    case 'PATCH': {
      try {
        return res.json(
          await prisma.order.update({
            where: {
              id: orderId,
            },
            data: z
              .object({
                status: z.enum([
                  'PENDING',
                  'CONFIRMED',
                  'CANCELLED',
                  'REFUNDED',
                  'INCOMPLETE',
                ]),
                paymentId: z.string().optional(),
              })
              .parse(req.body),
          }),
        );
      } catch (error) {
        return res.status(400).json({
          error:
            error instanceof z.ZodError ? error.flatten() : 'error in partch',
        });
      }
    }
    default: {
      return res.status(405).json({
        error: 'Method not allowed',
      });
    }
  }
}
