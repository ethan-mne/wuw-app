import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { env } from '@/env';
export const AuthRouter = createTRPCRouter({
  auth: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(
      ({ input }) =>
        input.username === 'admin' && input.password === env.ADMIN_PASSWORD,
    ),
});
