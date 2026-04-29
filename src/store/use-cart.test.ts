import { beforeEach, describe, expect, it } from 'vitest';
import { useCart } from './use-cart';

beforeEach(() => {
  useCart.getState().resetCart();
});

describe('useCart', () => {
  it('has correct initial state', () => {
    const state = useCart.getState();
    expect(state.tickets).toBe(1);
    expect(state.vipPack).toBeNull();
  });

  it('updateTickets sets both tickets and vipPack', () => {
    useCart.getState().updateTickets(5);
    const state = useCart.getState();
    expect(state.tickets).toBe(5);
    expect(state.vipPack).toBe(5);
  });

  it('updateVipPack sets both vipPack and tickets', () => {
    useCart.getState().updateVipPack(3);
    const state = useCart.getState();
    expect(state.vipPack).toBe(3);
    expect(state.tickets).toBe(3);
  });

  it('incTickets increments from current state', () => {
    useCart.getState().updateTickets(2);
    useCart.getState().incTickets(3);
    const state = useCart.getState();
    expect(state.tickets).toBe(5);
    expect(state.vipPack).toBe(5);
  });

  it('decTickets decrements with minimum of 0', () => {
    useCart.getState().updateTickets(5);
    useCart.getState().decTickets(2);
    const state = useCart.getState();
    expect(state.tickets).toBe(3);
    expect(state.vipPack).toBe(3);
  });

  it('decTickets with large amount results in 0, not negative', () => {
    useCart.getState().updateTickets(2);
    useCart.getState().decTickets(10);
    const state = useCart.getState();
    expect(state.tickets).toBe(0);
    expect(state.vipPack).toBe(0);
  });

  it('resetCart returns to initial state', () => {
    useCart.getState().updateTickets(10);
    useCart.getState().resetCart();
    const state = useCart.getState();
    expect(state.tickets).toBe(1);
    expect(state.vipPack).toBeNull();
  });
});
