import * as z from 'zod';
import {
  order_paymentMethod as PaymentMethod,
  order_status,
} from '@/lib/prisma-enums';

export const OrderSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  country: z.string(),
  address: z.string(),
  town: z.string(),
  zip: z.string(),
  phone: z.string(),
  email: z.string(),
  date: z.date(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  checkedEmail: z.boolean(),
  checkedTerms: z.boolean(),
  paymentId: z.string().optional(),
  totalPrice: z.number(),
  status: z.nativeEnum(order_status),
  coupon: z.string().max(8).optional(),
  utm: z.string().optional(),
  challenge_answer: z.boolean().default(false),
});
