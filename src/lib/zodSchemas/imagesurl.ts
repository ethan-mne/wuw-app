import * as z from 'zod';

export const ImagesUrlSchema = z.object({
  id: z.string(),
  url: z.string(),
  WatchesId: z.string(),
});
