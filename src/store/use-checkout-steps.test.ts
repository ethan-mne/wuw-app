import { beforeEach, describe, expect, it } from 'vitest';
import { useCheckoutSteps } from './use-checkout-steps';

beforeEach(() => {
  useCheckoutSteps.getState().resetSteps();
  useCheckoutSteps.getState().setChallengeAnswer(null);
});

describe('useCheckoutSteps', () => {
  it('has correct initial state', () => {
    const state = useCheckoutSteps.getState();
    expect(state.step).toBe(1);
    expect(state.paymentStep).toBe(false);
    expect(state.challenge_answer).toBeNull();
    expect(state.gift).toBeUndefined();
  });

  it('incStep increments step by 1', () => {
    useCheckoutSteps.getState().incStep();
    expect(useCheckoutSteps.getState().step).toBe(2);
  });

  it('incStep does not exceed 4', () => {
    const { incStep } = useCheckoutSteps.getState();
    incStep();
    incStep();
    incStep();
    incStep();
    incStep();
    expect(useCheckoutSteps.getState().step).toBe(4);
  });

  it('updatePaymentStep sets paymentStep to true and false', () => {
    useCheckoutSteps.getState().updatePaymentStep(true);
    expect(useCheckoutSteps.getState().paymentStep).toBe(true);

    useCheckoutSteps.getState().updatePaymentStep(false);
    expect(useCheckoutSteps.getState().paymentStep).toBe(false);
  });

  it('setChallengeAnswer sets to true, false, and null', () => {
    useCheckoutSteps.getState().setChallengeAnswer(true);
    expect(useCheckoutSteps.getState().challenge_answer).toBe(true);

    useCheckoutSteps.getState().setChallengeAnswer(false);
    expect(useCheckoutSteps.getState().challenge_answer).toBe(false);

    useCheckoutSteps.getState().setChallengeAnswer(null);
    expect(useCheckoutSteps.getState().challenge_answer).toBeNull();
  });

  it('updateGift creates gift object with correct fields', () => {
    useCheckoutSteps
      .getState()
      .updateGift(
        'Alice',
        'alice@example.com',
        'Happy birthday!',
        '+44123456789',
      );
    const gift = useCheckoutSteps.getState().gift;
    expect(gift).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Happy birthday!',
      phone: '+44123456789',
    });
  });

  it('resetSteps returns step=1, paymentStep=false, gift=undefined', () => {
    useCheckoutSteps.getState().incStep();
    useCheckoutSteps.getState().incStep();
    useCheckoutSteps.getState().updatePaymentStep(true);
    useCheckoutSteps
      .getState()
      .updateGift('Bob', 'bob@test.com', 'Hi', '+1234');

    useCheckoutSteps.getState().resetSteps();
    const state = useCheckoutSteps.getState();
    expect(state.step).toBe(1);
    expect(state.paymentStep).toBe(false);
    expect(state.gift).toBeUndefined();
  });
});
