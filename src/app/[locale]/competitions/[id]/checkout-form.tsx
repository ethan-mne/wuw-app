/*  eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Stepper } from './stepper';
import { SelectTicketStep } from './select-ticket-step';
import { ConnoisseurChallengeStep } from './connoisseur-challenge-step';
import { CheckoutStep } from './checkout-step';
import { CongratsStep } from './congrats-step';
import { useEffect, useState, type ReactNode } from 'react';
import { useCheckoutSteps } from '@/store/use-checkout-steps';
import type { CompetitionInterface } from '@/lib/interfaces';
import type { profileType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCart } from '@/store/use-cart';

type Step = {
  id: number;
  name: string;
  component: ReactNode;
};

export function CheckoutForm({
  competition,
  profile,
  utm,
}: Readonly<{
  competition: CompetitionInterface;
  profile: profileType | null;
  utm?: string;
}>) {
  //client first name usestate
  const [clientInfo, setClientInfo] = useState<{
    firstName: string;
    email: string;
  }>();
  const { resetSteps, step } = useCheckoutSteps();
  const { resetCart } = useCart();

  useEffect(() => {
    return () => {
      resetSteps();
      resetCart();
    };
  }, []);

  const steps: Record<number, Step> = {
    1: {
      id: 1,
      name: 'Select Ticket',
      component: <SelectTicketStep competition={competition} />,
    },
    2: {
      id: 2,
      name: 'Connoisseur Challenge',
      component: <ConnoisseurChallengeStep competition={competition} />,
    },
    3: {
      id: 3,
      name: 'Checkout',
      component: (
        <CheckoutStep
          competition={competition}
          profile={profile}
          setClientInfo={setClientInfo}
          utm={utm}
        />
      ),
    },
    4: {
      id: 4,
      name: 'Congratulations',
      component: (
        <CongratsStep
          competition={competition}
          profile={profile}
          order={{
            first_name: clientInfo?.firstName ?? '',
            email: clientInfo?.email ?? '',
          }}
        />
      ),
    },
  };

  return (
    <div className='w-full flex flex-col  gap-8 md:gap-16'>
      <Stepper
        active={step}
        className={cn('mt-6 px-4 md:px-0', {
          'hidden md:flex': step === 4,
        })}
      />
      {steps[step]?.component}
    </div>
  );
}
