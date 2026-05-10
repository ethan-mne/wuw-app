import { db } from '@/server/db';

export function getTicketsByOrderId(orderId: string) {
  return db.ticket.findMany({
    where: {
      orderId,
    },
  });
}
