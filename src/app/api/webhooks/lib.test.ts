import { HandelConfirmedORder } from './lib';
import { db } from '@/server/db';
import { sendConfirmationEmail } from '@/lib/sendConfirmationEmail';
import type { Order, Ticket, Competition, User } from '@prisma/client';
import {
  order_paymentMethod,
  order_status,
  CompetitionStatus,
} from '@/lib/prisma-enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  db: {
    ticket: { findMany: vi.fn() },
    competition: { findUnique: vi.fn(), update: vi.fn() },
    gift: { findFirst: vi.fn() },
    user: { findFirst: vi.fn(), update: vi.fn() },
    order: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/sendConfirmationEmail', () => ({
  sendConfirmationEmail: vi.fn(),
}));

const mockDate = new Date('2024-01-01T00:00:00Z');

const mockOrder: Order = {
  id: 'order-123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  country: 'GB',
  address: '123 Street',
  town: 'London',
  zip: 'SW1A 1AA',
  phone: '+447123456789',
  date: mockDate,
  paymentMethod: order_paymentMethod.STRIPE,
  checkedEmail: true,
  checkedTerms: true,
  paymentId: 'pay-123',
  totalPrice: 100,
  status: order_status.PENDING,
  coupon: null,
  utm: null,
  challenge_answer: false,
  createdAt: mockDate,
  updatedAt: mockDate,
  intentId: null,
  affiliationId: null,
  runUpPrizeId: null,
};

const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    competitionId: 'comp-1',
    orderId: 'order-123',
    createdAt: mockDate,
    updatedAt: mockDate,
    ticketPrice: 10,
    reduction: 0,
    affiliation_reduction: 0,
  },
  {
    id: 'ticket-2',
    competitionId: 'comp-1',
    orderId: 'order-123',
    createdAt: mockDate,
    updatedAt: mockDate,
    ticketPrice: 10,
    reduction: 0,
    affiliation_reduction: 0,
  },
  {
    id: 'ticket-3',
    competitionId: 'comp-1',
    orderId: 'order-123',
    createdAt: mockDate,
    updatedAt: mockDate,
    ticketPrice: 10,
    reduction: 0,
    affiliation_reduction: 0,
  },
];

const mockCompetition: Competition = {
  id: 'comp-1',
  name: 'Win a Watch',
  max_watch_number: 1,
  max_space_in_final_draw: 10,
  winner_announcement_date: null,
  start_date: mockDate,
  end_date: mockDate,
  run_up_prize: null,
  drawing_date: mockDate,
  remaining_tickets: 80,
  ticket_price: 10,
  total_tickets: 100,
  cash_alternative: null,
  max_winners: 1,
  location: 'London',
  price: 50,
  status: CompetitionStatus.ACTIVE,
  winner: null,
  second_reward: null,
  createdAt: mockDate,
  updatedAt: mockDate,
  watchesId: 'watches-1',
  showtickets: false,
  comp_image_url: 'https://example.com/image.jpg',
  is_gold: false,
  comp_image_provider: null,
};

const mockUpdatedOrder: Order = {
  ...mockOrder,
  status: order_status.CONFIRMED,
};

function createMockUser(wincoin = 0): User {
  return {
    id: 'user-123',
    firstName: null,
    lastName: null,
    country: null,
    zipCode: null,
    address: null,
    city: null,
    phone: null,
    name: null,
    email: 'john@example.com',
    emailVerified: null,
    image: null,
    wincoin,
    utm: null,
    is_admin: false,
    createdAt: mockDate,
    updatedAt: mockDate,
    emailVerifiedBool: false,
  };
}

function setupSuccessMocks(options?: {
  userWincoin?: number;
  ticketCount?: number;
}) {
  const tickets = options?.ticketCount
    ? mockTickets.slice(0, options.ticketCount)
    : mockTickets;

  vi.mocked(db.ticket.findMany).mockResolvedValue(tickets);
  vi.mocked(db.competition.findUnique).mockResolvedValue(mockCompetition);
  vi.mocked(db.gift.findFirst).mockResolvedValue(null);
  vi.mocked(db.order.update).mockResolvedValue(mockUpdatedOrder);
  vi.mocked(db.competition.update).mockResolvedValue(mockCompetition);
  vi.mocked(db.user.update).mockResolvedValue(
    createMockUser(options?.userWincoin ?? 0),
  );
  vi.mocked(sendConfirmationEmail).mockResolvedValue({
    success: true,
    giftSuccess: false,
    data: { data: { id: 'mock-email-id' }, error: null },
  });

  // First $transaction call returns [competition, gift]
  // Second $transaction call returns [updatedOrder, updatedCompetition]
  vi.mocked(db.$transaction)
    .mockResolvedValueOnce([mockCompetition, null])
    .mockResolvedValueOnce([mockUpdatedOrder, mockCompetition]);

  vi.mocked(db.user.findFirst).mockResolvedValue(
    createMockUser(options?.userWincoin ?? 0),
  );
}

describe('HandelConfirmedORder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully confirms order', async () => {
    setupSuccessMocks();

    const result = await HandelConfirmedORder(mockOrder);

    expect(db.ticket.findMany).toHaveBeenCalledWith({
      where: { orderId: 'order-123' },
      select: { competitionId: true, id: true },
    });
    expect(sendConfirmationEmail).toHaveBeenCalled();
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockUpdatedOrder);
  });

  it('throws when no tickets found', async () => {
    vi.mocked(db.ticket.findMany).mockResolvedValue([]);

    await expect(HandelConfirmedORder(mockOrder)).rejects.toThrow(
      'No tickets found for order: order-123',
    );
  });

  it('throws when competition not found', async () => {
    vi.mocked(db.ticket.findMany).mockResolvedValue(mockTickets);
    vi.mocked(db.$transaction).mockResolvedValueOnce([null, null]);

    await expect(HandelConfirmedORder(mockOrder)).rejects.toThrow(
      'Competition not found',
    );
  });

  it('calculates wincoins correctly (3 tickets * 10 = 30)', async () => {
    setupSuccessMocks({ userWincoin: 0, ticketCount: 3 });

    await HandelConfirmedORder(mockOrder);

    expect(db.user.update).toHaveBeenCalledWith({
      data: { wincoin: 30 },
      where: { id: 'user-123' },
    });
  });

  it('caps wincoins at 100 (user has 90, buys 3 tickets)', async () => {
    setupSuccessMocks({ userWincoin: 90, ticketCount: 3 });

    await HandelConfirmedORder(mockOrder);

    expect(db.user.update).toHaveBeenCalledWith({
      data: { wincoin: 100 },
      where: { id: 'user-123' },
    });
  });

  it('skips wincoin update when user already at 100', async () => {
    setupSuccessMocks({ userWincoin: 100 });

    await HandelConfirmedORder(mockOrder);

    expect(db.user.update).not.toHaveBeenCalled();
  });
});
