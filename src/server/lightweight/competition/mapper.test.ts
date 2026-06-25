import { describe, expect, it } from 'vitest';

import { mapCompetitionToMobileListDto } from '@/server/lightweight/competition/mapper';

describe('mapCompetitionToMobileListDto', () => {
  it('prefers competition hero image and returns a single thumbnail', () => {
    const dto = mapCompetitionToMobileListDto({
      id: 'cmp-1',
      name: 'Rolex Sub',
      start_date: new Date('2026-01-01T00:00:00.000Z'),
      total_tickets: 100,
      ticket_price: 5,
      price: 12000,
      cash_alternative: null,
      max_winners: 1,
      end_date: new Date('2026-06-01T00:00:00.000Z'),
      drawing_date: new Date('2026-06-01T12:00:00.000Z'),
      status: 'ACTIVE',
      comp_image_url: 'https://cdn.example/hero.jpg',
      Watches: {
        brand: 'Rolex',
        model: 'Submariner',
        images_url: [{ url: 'https://cdn.example/gallery-1.jpg' }],
      },
      _count: { Ticket: 10 },
    });

    expect(dto.watch.images).toEqual([
      { url: 'https://cdn.example/hero.jpg', alt: 'Rolex Sub image' },
    ]);
    expect(dto.watch.movement).toBe('');
    expect(dto.remainingTickets).toBe(90);
  });

  it('falls back to the first watch image when no hero is set', () => {
    const dto = mapCompetitionToMobileListDto({
      id: 'cmp-2',
      name: 'Omega Speedy',
      start_date: new Date('2026-01-01T00:00:00.000Z'),
      total_tickets: 50,
      ticket_price: 3,
      price: 8000,
      end_date: new Date('2026-07-01T00:00:00.000Z'),
      drawing_date: new Date('2026-07-01T12:00:00.000Z'),
      status: 'ACTIVE',
      comp_image_url: null,
      Watches: {
        brand: 'Omega',
        model: 'Speedmaster',
        images_url: [{ url: 'https://cdn.example/watch.jpg' }],
      },
      _count: { Ticket: 0 },
    });

    expect(dto.watch.images).toEqual([
      { url: 'https://cdn.example/watch.jpg', alt: 'Omega Speedy image' },
    ]);
  });
});
