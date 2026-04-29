'use client';

import { SwipeAnimatedButton } from '@/components/animated-button';
import type { CompetitionInterface } from '@/lib/interfaces';
import type { profileType } from '@/lib/types';
import type { Order } from '@prisma/client';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function CongratsStep({
  competition,
  profile,
  order,
}: Readonly<{
  competition: CompetitionInterface;
  profile?: profileType | null;
  order: Pick<Order, 'first_name' | 'email'>;
}>) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const router = useRouter();
  const Tcompetition = useTranslations('competition');
  const Thome = useTranslations('home');

  return (
    <div className='w-full flex justify-center items-center p-4 md:p-0'>
      <div className='w-full lg:w-4/5 flex flex-col self-center gap-8 '>
        <p className='text-[24px] text-foreground font-bold uppercase -tracking-[0.05em]'>
          {Tcompetition('congratulation')} {order.first_name}
        </p>
        <div className='flex flex-col text-[40px] md:text-[64px] font-bold leading-tight -tracking-[0.05em]'>
          <p className='uppercase text-foreground'>
            {Tcompetition('officially_potential_winner')}
          </p>
          <p className='uppercase text-secondary'>
            {Thome('competition')} {competition.name}
          </p>
        </div>
        <p className='text-[#898989] text-[22px] md:text-[26px] font-bold  -tracking-[0.03em] leading-[37px]'>
          {Tcompetition('connect_to_personal_account')}
        </p>
        <SwipeAnimatedButton
          text={'Access to your account'}
          className='w-full'
          onClick={() =>
            profile
              ? router.push('/account/dashboard')
              : signIn('email', {
                  email: order.email,
                }).then(() =>
                  toast.success(
                    'Login email sent successfully, please verify mailbox',
                  ),
                )
          }
        />
      </div>
    </div>
  );
}
