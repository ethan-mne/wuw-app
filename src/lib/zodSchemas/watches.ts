import * as z from 'zod';

export const WatchesSchema = z.object({
  id: z.string(),
  brand: z.string(),
  model: z.string(),
  reference_number: z.string(),
  movement: z.string(),
  Bracelet_material: z.string(),
  year_of_manifacture: z.number().int(),
  caliber_grear: z.number().int(),
  number_of_stones: z.number().int(),
  glass: z.string(),
  bezel_material: z.string(),
  has_box: z.boolean(),
  has_certificate: z.boolean(),
  condition: z.string(),
  images_url: z.array(z.string()),
});
