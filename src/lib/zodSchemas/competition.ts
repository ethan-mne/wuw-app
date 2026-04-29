import * as z from 'zod';
import { CompetitionStatus } from '@/lib/prisma-enums';

export const CompetitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  max_watch_number: z.number().int(),
  max_space_in_final_draw: z.number().int(),
  winner_announcement_date: z.date().nullish(),
  start_date: z.date(),
  end_date: z.date(),
  run_up_prize: z.string().nullish(),
  drawing_date: z.date(),
  remaining_tickets: z.number().int(),
  ticket_price: z.number(),
  total_tickets: z.number().int(),
  location: z.string(),
  price: z.number(),
  cash_alternative: z.number().nullish(),
  status: z.nativeEnum(CompetitionStatus),
  winner: z.string().nullish(),
  second_reward: z.string().nullish(),
  showtickets: z.boolean().default(false),
  watchesId: z.string(),
  comp_image_url: z.string().nullish(),
  max_winners: z.number().int().default(1),
});
