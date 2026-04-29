import { describe, it, expect, vi } from 'vitest';

vi.mock('@prisma/client', () => ({
  order_paymentMethod: {
    STRIPE: 'STRIPE',
    PAYPAL: 'PAYPAL',
    AFFILIATION: 'AFFILIATION',
    MARKETING: 'MARKETING',
    WINCOIN: 'WINCOIN',
    AUREAVIA: 'AUREAVIA',
    WORLDCARD: 'WORLDCARD',
    VOUCH_LAB: 'VOUCH_LAB',
  },
  order_status: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
    INCOMPLETE: 'INCOMPLETE',
    ATTEMPTED: 'ATTEMPTED',
  },
  CompetitionStatus: {
    ACTIVE: 'ACTIVE',
    NOT_ACTIVE: 'NOT_ACTIVE',
    COMPLETED: 'COMPLETED',
  },
}));

import { OrderSchema } from './order';
import { CompetitionSchema } from './competition';
import { TicketSchema } from './ticket';
import { WatchesSchema } from './watches';
import { affiliationSchema } from './affiliation';
import { QuestionSchema } from './question';
import { answerSchema } from './answer';
import { ImagesUrlSchema } from './imagesurl';
import { winnerSchema } from './otherSchemas';

describe('OrderSchema', () => {
  const validOrder = {
    id: 'order-1',
    first_name: 'John',
    last_name: 'Doe',
    country: 'GB',
    address: '123 Test St',
    town: 'London',
    zip: 'SW1A 1AA',
    phone: '+441234567890',
    email: 'john@example.com',
    date: new Date(),
    paymentMethod: 'WORLDCARD',
    checkedEmail: true,
    checkedTerms: true,
    totalPrice: 100,
    status: 'PENDING',
  };

  it('should validate a valid order with all fields', () => {
    const result = OrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('should reject an invalid paymentMethod', () => {
    const result = OrderSchema.safeParse({
      ...validOrder,
      paymentMethod: 'INVALID_METHOD',
    });
    expect(result.success).toBe(false);
  });

  it('should reject when required fields are missing', () => {
    const result = OrderSchema.safeParse({
      id: 'order-1',
      first_name: 'John',
    });
    expect(result.success).toBe(false);
  });
});

describe('CompetitionSchema', () => {
  const validCompetition = {
    id: 'comp-1',
    name: 'Test Competition',
    max_watch_number: 5,
    max_space_in_final_draw: 100,
    start_date: new Date(),
    end_date: new Date(),
    drawing_date: new Date(),
    remaining_tickets: 50,
    ticket_price: 10,
    total_tickets: 100,
    location: 'London',
    price: 5000,
    status: 'ACTIVE',
    watchesId: 'watch-1',
  };

  it('should validate a valid competition', () => {
    const result = CompetitionSchema.safeParse(validCompetition);
    expect(result.success).toBe(true);
  });

  it('should reject an invalid status', () => {
    const result = CompetitionSchema.safeParse({
      ...validCompetition,
      status: 'INVALID_STATUS',
    });
    expect(result.success).toBe(false);
  });

  describe('Competition.add input shape', () => {
    const AddInputSchema = CompetitionSchema.omit({
      id: true,
      remaining_tickets: true,
    }).required();

    const validAddInput = {
      name: 'Test Competition',
      max_watch_number: 5,
      max_space_in_final_draw: 100,
      winner_announcement_date: null,
      start_date: new Date(),
      end_date: new Date(),
      run_up_prize: null,
      drawing_date: new Date(),
      ticket_price: 10,
      total_tickets: 100,
      location: 'London',
      price: 5000,
      cash_alternative: null,
      status: 'ACTIVE' as const,
      winner: null,
      second_reward: null,
      showtickets: false,
      watchesId: 'watch-1',
      comp_image_url: null,
      max_winners: 1,
    };

    it('accepts a payload without remaining_tickets', () => {
      const result = AddInputSchema.safeParse(validAddInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect('remaining_tickets' in result.data).toBe(false);
      }
    });

    it('strips remaining_tickets if the client sends one', () => {
      const result = AddInputSchema.safeParse({
        ...validAddInput,
        remaining_tickets: 999,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect('remaining_tickets' in result.data).toBe(false);
      }
    });

    it('still requires total_tickets', () => {
      const { total_tickets: _tt, ...withoutTotal } = validAddInput;
      const result = AddInputSchema.safeParse(withoutTotal);
      expect(result.success).toBe(false);
    });
  });
});

describe('TicketSchema', () => {
  it('should validate a valid ticket', () => {
    const result = TicketSchema.safeParse({
      id: 'ticket-1',
      orderId: 'order-1',
      competitionId: 'comp-1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject when required fields are missing', () => {
    const result = TicketSchema.safeParse({
      id: 'ticket-1',
    });
    expect(result.success).toBe(false);
  });
});

describe('WatchesSchema', () => {
  const validWatch = {
    id: 'watch-1',
    brand: 'Rolex',
    model: 'Submariner',
    reference_number: 'REF-123',
    movement: 'Automatic',
    Bracelet_material: 'Steel',
    year_of_manifacture: 2023,
    caliber_grear: 3135,
    number_of_stones: 31,
    glass: 'Sapphire',
    bezel_material: 'Ceramic',
    has_box: true,
    has_certificate: true,
    condition: 'New',
    images_url: ['https://example.com/img1.jpg'],
  };

  it('should validate a watch with all required fields', () => {
    const result = WatchesSchema.safeParse(validWatch);
    expect(result.success).toBe(true);
  });

  it('should reject when required fields are missing', () => {
    const result = WatchesSchema.safeParse({
      id: 'watch-1',
      has_box: true,
      has_certificate: true,
      condition: 'New',
      images_url: ['img.jpg'],
    });
    expect(result.success).toBe(false);
  });
});

describe('affiliationSchema', () => {
  it('should validate a valid affiliation', () => {
    const result = affiliationSchema.safeParse({
      id: 'aff-1',
      discountCode: 'SAVE10',
      discountRate: 10,
      ownerEmail: 'owner@example.com',
      uses: 5,
    });
    expect(result.success).toBe(true);
  });
});

describe('QuestionSchema', () => {
  it('should validate a valid question', () => {
    const result = QuestionSchema.safeParse({
      id: 'q-1',
      question: 'What is the brand?',
      correctAnswer: 'Rolex',
    });
    expect(result.success).toBe(true);
  });
});

describe('answerSchema', () => {
  it('should validate a valid answer', () => {
    const result = answerSchema.safeParse({
      id: 'a-1',
      answer: 'Rolex',
      questionId: 'q-1',
    });
    expect(result.success).toBe(true);
  });
});

describe('ImagesUrlSchema', () => {
  it('should validate a valid image url entry', () => {
    const result = ImagesUrlSchema.safeParse({
      id: 'img-1',
      url: 'https://example.com/image.jpg',
      WatchesId: 'watch-1',
    });
    expect(result.success).toBe(true);
  });
});

describe('winnerSchema', () => {
  it('should validate a valid winner', () => {
    const result = winnerSchema.safeParse({
      id: 1,
      img: 'https://example.com/winner.jpg',
      name: 'John Doe',
      value: 5000,
      date: new Date(),
      watch_name: 'Rolex Submariner',
      src: 'https://example.com/source',
    });
    expect(result.success).toBe(true);
  });

  it('should validate with all nullish fields', () => {
    const result = winnerSchema.safeParse({});
    expect(result.success).toBe(true);

    const resultWithNulls = winnerSchema.safeParse({
      id: undefined,
      img: null,
      name: null,
      value: null,
      date: null,
      watch_name: null,
      src: null,
    });
    expect(resultWithNulls.success).toBe(true);
  });
});
