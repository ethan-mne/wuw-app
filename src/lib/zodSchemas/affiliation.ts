import * as z from 'zod';

export const affiliationSchema = z.object({
  id: z.string(),
  discountCode: z.string(),
  discountRate: z.number(),
  ownerEmail: z.string().email({ message: 'Invalid email address' }),
  uses: z.number().int(),
});
