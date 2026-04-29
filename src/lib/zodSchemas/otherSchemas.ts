import { z } from 'zod';
export const winnerSchema = z.object({
  id: z.number().optional(),
  img: z.string().nullish(),
  name: z.string().nullish(),
  value: z.number().int().nullish(),
  date: z.date().nullish(),
  watch_name: z.string().nullish(),
  src: z.string().nullish(),
});
