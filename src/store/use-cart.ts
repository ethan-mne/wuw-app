import { create } from 'zustand';

type Cart = {
  tickets: number;
  vipPack: number | null;
  updateTickets: (amount: number) => void;
  updateVipPack: (amount: number) => void;
  incTickets: (amount: number) => void;
  decTickets: (amount: number) => void;
  resetCart: () => void;
};
export const useCart = create<Cart>((set) => ({
  tickets: 1,
  vipPack: null,
  resetCart() {
    set(() => ({
      tickets: 1,
      vipPack: null,
    }));
  },
  updateTickets: (amount) =>
    set(() => ({
      tickets: amount,
      vipPack: amount,
    })),
  updateVipPack: (amount) =>
    set(() => ({
      vipPack: amount,
      tickets: amount,
    })),
  incTickets: (amount) =>
    set((state) => ({
      tickets: state.tickets + amount,
      vipPack: state.tickets + amount,
    })),
  decTickets: (amount) =>
    set((state) => ({
      tickets: Math.max(0, state.tickets - amount),
      vipPack: Math.max(0, state.tickets - amount),
    })),
}));
