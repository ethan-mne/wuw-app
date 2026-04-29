import { createTRPCRouter } from '@/server/api/trpc';
import {
  AffiliationRouter,
  // AuthRouter,
  ChartsRouter,
  CompetitionRouter,
  QuestionRouter,
  RunUpPrizeRouter,
  TicketsRouter,
  WatchesRouter,
  WinnersRouter,
} from './routers';
import { newCompetitionRouter } from './routers/competition';
import { OrderRouter } from './routers/orders';
import { ReferalRouter } from './routers/referral';
import { UsersRouter } from './routers/users';
import { AmountWon, winners } from './routers/winners';
import { otherRouter } from './routers/other';
import { paymentsRouter } from './routers/payments';
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // post: postRouter,
  Competition: CompetitionRouter,
  Watches: WatchesRouter,
  Order: OrderRouter,
  Question: QuestionRouter,
  Tickets: TicketsRouter,
  // DashAuth: AuthRouter,
  Winners: WinnersRouter,
  Affiliation: AffiliationRouter,
  Charts: ChartsRouter,
  RunUpPrize: RunUpPrizeRouter,
  Users: UsersRouter,
  Referal: ReferalRouter,
  NewCompetition: newCompetitionRouter,
  AmountWon,
  winners,
  other: otherRouter,
  payments: paymentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
