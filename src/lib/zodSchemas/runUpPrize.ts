import * as z from 'zod';

export const affiliationSchema = z.object({
  id: z.string(),
  couponCode: z.string(),
  maxUsage: z.number().int().default(1),
});
