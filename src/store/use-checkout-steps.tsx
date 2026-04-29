import { create } from 'zustand';

interface Gift {
  email: string;
  name: string;
  message: string;
  phone: string;
}

type CheckoutSteps = {
  step: number;
  incStep: () => void;
  paymentStep: boolean;
  updatePaymentStep: (active: boolean) => void;
  gift?: Gift | undefined;
  challenge_answer: boolean | null;
  setChallengeAnswer: (answer: boolean | null) => void;
  updateGift: (
    name: string,
    email: string,
    message: string,
    phone: string,
  ) => void;
  resetSteps: () => void;
};

export const useCheckoutSteps = create<CheckoutSteps>((set) => ({
  step: 1,
  paymentStep: false,
  challenge_answer: null,
  setChallengeAnswer: (answer) => {
    set(() => ({
      challenge_answer: answer,
    }));
  },
  resetSteps: () => {
    set(() => ({
      step: 1,
      paymentStep: false,
      gift: undefined,
    }));
  },
  updateGift: (name: string, email: string, message: string, phone: string) => {
    set(() => ({
      gift: {
        name: name,
        email: email,
        message: message,
        phone: phone,
      },
    }));
  },
  incStep: () =>
    set((state) => ({
      step: Math.min(state.step + 1, 4),
    })),
  updatePaymentStep: (active) =>
    set(() => ({
      paymentStep: active,
    })),
}));
