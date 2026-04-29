import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// Mock tRPC module before importing the router
vi.mock('@/server/api/trpc', async () => {
  const { initTRPC } = await import('@trpc/server');
  const t = initTRPC.context<any>().create();
  return {
    createTRPCRouter: t.router,
    protectedProcedure: t.procedure,
    publicProcedure: t.procedure,
  };
});

vi.mock('@/server/api/routers/index', () => ({
  GetData: vi.fn(),
  emailSender: vi.fn(),
}));

vi.mock('@/lib/sendConfirmationEmail', () => ({
  sendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/env', () => ({
  env: {},
}));

vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@prisma/client')>();
  return { ...actual };
});

vi.mock('@faker-js/faker', () => ({
  faker: {
    string: { uuid: vi.fn().mockReturnValue('test-uuid') },
  },
}));

vi.mock('@/server/utils', async () => {
  const actual = await import('@/server/utils');
  return actual;
});

vi.mock('@/lib/types', () => ({}));

// Import after mocks
const { OrderRouter } = await import('./orders');

const makeCtx = (overrides: Record<string, unknown> = {}) => ({
  session: { user: { id: 'user-1', email: 'user@test.com' } },
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    competition: { findUnique: vi.fn(), updateMany: vi.fn() },
    referrals: { findUnique: vi.fn() },
    order: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  ...overrides,
});

const mockProfile = {
  id: 'user-1',
  email: 'user@test.com',
  phone: '+1234567890',
  firstName: 'John',
  lastName: 'Doe',
  wincoin: 100,
};

const mockReferral = { user_id: 'user-1' };

describe('redeemFreeTicket', () => {
  let ctx: ReturnType<typeof makeCtx>;
  let caller: ReturnType<typeof OrderRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = makeCtx();
    caller = OrderRouter.createCaller(ctx as any);
  });

  describe('sold-out error propagation (Bug 2)', () => {
    it('throws BAD_REQUEST when competition is sold out — not INTERNAL_SERVER_ERROR', async () => {
      const soldOutComp = {
        id: 'comp-1',
        total_tickets: 10,
        remaining_tickets: 0,
        name: 'Test Comp',
        end_date: new Date(),
        price: 100,
        ticket_price: 10,
        status: 'ACTIVE',
        max_winners: 1,
        cash_alternative: 50,
        Watches: [],
        _count: { Ticket: 10 },
      };

      ctx.prisma.user.findUnique = vi.fn().mockResolvedValue(mockProfile);
      ctx.prisma.competition.findUnique = vi.fn().mockResolvedValue(soldOutComp);
      ctx.prisma.referrals.findUnique = vi.fn().mockResolvedValue(mockReferral);

      // remaining_tickets = 0, so updateMany finds 0 rows → sold-out TRPCError
      ctx.prisma.$transaction = vi.fn().mockImplementation(async (fn: any) =>
        fn({
          competition: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
          order: { create: vi.fn() },
          user: { update: vi.fn() },
        }),
      );

      await expect(caller.redeemFreeTicket('comp-1')).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'This competition is sold out',
      });
    });
  });

  describe('derived sold-out check inside transaction (Bug 1)', () => {
    it('counts confirmed tickets inside the transaction and ignores stale remaining_tickets', async () => {
      const availableComp = {
        id: 'comp-1',
        total_tickets: 10,
        remaining_tickets: 0,
        name: 'Test Comp',
        end_date: new Date(),
        price: 100,
        ticket_price: 10,
        status: 'ACTIVE',
        max_winners: 1,
        cash_alternative: 50,
        Watches: [],
        _count: { Ticket: 5 },
      };

      const mockOrder = { id: 'test-uuid' };
      ctx.prisma.user.findUnique = vi.fn().mockResolvedValue(mockProfile);
      ctx.prisma.competition.findUnique = vi.fn().mockResolvedValue(availableComp);
      ctx.prisma.referrals.findUnique = vi.fn().mockResolvedValue(mockReferral);

      const txTicketCount = vi.fn().mockResolvedValue(5);
      const txOrderCreate = vi.fn().mockResolvedValue(mockOrder);
      const txUserUpdate = vi.fn().mockResolvedValue({});

      ctx.prisma.$transaction = vi.fn().mockImplementation(async (fn: any) =>
        fn({
          ticket: { count: txTicketCount },
          competition: { updateMany: vi.fn() },
          order: { create: txOrderCreate },
          user: { update: txUserUpdate },
        }),
      );

      await caller.redeemFreeTicket('comp-1');

      expect(txTicketCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            competitionId: 'comp-1',
            Order: { status: 'CONFIRMED' },
          }),
        }),
      );
      expect(txOrderCreate).toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when confirmed ticket count reaches capacity inside the transaction', async () => {
      const availableComp = {
        id: 'comp-1',
        total_tickets: 10,
        remaining_tickets: 999,
        name: 'Test Comp',
        end_date: new Date(),
        price: 100,
        ticket_price: 10,
        status: 'ACTIVE',
        max_winners: 1,
        cash_alternative: 50,
        Watches: [],
        _count: { Ticket: 9 },
      };

      ctx.prisma.user.findUnique = vi.fn().mockResolvedValue(mockProfile);
      ctx.prisma.competition.findUnique = vi.fn().mockResolvedValue(availableComp);
      ctx.prisma.referrals.findUnique = vi.fn().mockResolvedValue(mockReferral);

      const txTicketCount = vi.fn().mockResolvedValue(10);
      const txOrderCreate = vi.fn();

      ctx.prisma.$transaction = vi.fn().mockImplementation(async (fn: any) =>
        fn({
          ticket: { count: txTicketCount },
          competition: { updateMany: vi.fn() },
          order: { create: txOrderCreate },
          user: { update: vi.fn() },
        }),
      );

      await expect(caller.redeemFreeTicket('comp-1')).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'This competition is sold out',
      });
      expect(txOrderCreate).not.toHaveBeenCalled();
    });
  });
});
