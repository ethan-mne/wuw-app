'use client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { RedeemTicket } from './dashboard/redeem-ticket';
import type { CompetitionInterface } from '@/lib/interfaces';
import { useTranslations } from 'next-intl';
export function CoinsProgress({
  progress,
  coins,
  containerStyle,
  progressBarStyle,
  textStyle,
  coinsTextStyle,
  currentCompetitions,
}: {
  progress: number;
  coins: number;
  containerStyle?: string;
  progressBarStyle?: string;
  textStyle?: string;
  coinsTextStyle?: string;
  currentCompetitions: CompetitionInterface[];
}) {
  const [open, setOpen] = useState(false);
  const Taccount = useTranslations('account');
  return (
    <>
      <div className='w-full flex flex-col gap-[15px] '>
        {!(coins >= 100) ? (
          <div
            className={cn(
              'w-full flex justify-center items-center h-[86px] border-2 border-foreground',
              containerStyle,
            )}
          >
            <p
              className={cn(
                'text-[18px] font-bold text-foreground -tracking-normal text-center truncate',
                coinsTextStyle,
              )}
            >
              {Taccount('you_own_actually')} {coins} {Taccount('win_coins')}
            </p>
          </div>
        ) : currentCompetitions.length === 0 ? (
          <Button
            className='bg-gray-400 hover:bg-gray-400 w-[300px] xs:w-[334px] inline-flex justify-center items-center p-0 rounded-[5px] h-[58px] mx-auto mb-[41px] opacity-60 cursor-not-allowed'
            type='button'
            disabled
          >
            <span className='text-[20px] font-bold -tracking-[0.03em] text-background'>
              {Taccount('use_your_free_ticket')}
            </span>
          </Button>
        ) : (
          <Button
            className='bg-secondary hover:bg-secondary  w-[300px] xs:w-[334px] inline-flex justify-center items-center p-0  rounded-[5px] h-[58px] mx-auto mb-[41px]'
            type='button'
            onClick={() => setOpen(true)}
          >
            <span className='text-[20px] font-bold -tracking-[0.03em] text-background '>
              {Taccount('use_your_free_ticket')}
            </span>
          </Button>
        )}
        <div className='w-full flex flex-col gap-[9px]'>
          <Progress
            value={progress}
            className={cn('bg-black h-[14px] rounded-[7px]', progressBarStyle)}
          />
          <div className='w-full flex justify-between px-1'>
            <p
              className={cn(
                'text-[14px] font-bold -tracking-normal',
                textStyle,
              )}
            >
              0
            </p>
            <p
              className={cn(
                'text-[14px] font-bold -tracking-normal',
                textStyle,
              )}
            >
              {Taccount('100_1_free_ticket')}
            </p>
          </div>
        </div>
      </div>
      <RedeemTicket
        open={open}
        setOpen={setOpen}
        currentCompetitions={currentCompetitions}
      />
    </>
  );
}
