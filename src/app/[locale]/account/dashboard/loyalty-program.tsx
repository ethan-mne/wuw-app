import { useTranslations } from 'next-intl';
import type { CompetitionInterface } from '@/lib/interfaces';
import { CoinsProgress } from '../coins-progress';
import { Winuwatch } from '@/components/icons';

export function LoyaltyProgram({
  wincoins,
  currentCompetitions,
}: {
  wincoins: number;
  currentCompetitions: CompetitionInterface[];
}) {
  const Taccount = useTranslations('account');
  return (
    <div className='w-full h-[440px] bg-foreground flex flex-col justify-center items-center px-4 md:px-0  '>
      <div className='w-full md:w-4/5 flex flex-col  items-center justify-center'>
        <div className='w-full flex flex-col justify-center items-start md:items-center mb-[51px]'>
          <Winuwatch
            className='fill-white h-[13px] w-[119px] md:hidden'
            preserveAspectRatio='none'
          />
          <h2 className='font-bold text-[24px] text-white  -tracking-normal'>
            <span className='text-secondary'>{Taccount('loyalty')} </span>
            {Taccount('program')}
          </h2>
          <p className='font-bold text-[16px] text-white hidden md:block  -tracking-normal'>
            {Taccount('our_aim_for_everyone_to_own_their_dream_watch')}
          </p>
        </div>

        <CoinsProgress
          progress={wincoins}
          coins={wincoins}
          containerStyle='border-background w-full'
          textStyle='text-background'
          progressBarStyle='bg-background'
          coinsTextStyle='text-[18px] md:text-[20px] text-background'
          currentCompetitions={currentCompetitions}
        />
        <div className='w-full flex flex-col justify-center items-start md:items-center mt-[31px]'>
          <p className='text-background font-bold text-[18px] md:text-[20px]'>
            {Taccount('1_ticket_purchased_10_wincoins')}
          </p>
          <p className='text-background font-bold text-[18px] md:text-[20px]'>
            {Taccount('100_wincoins_1_free_ticket')}
          </p>
        </div>
      </div>
      <p className='w-full md:w-full font-medium text-[12px] md:text-[13px] text-[#C5C5C5]  text-start md:text-center mt-[29px]'>
        {Taccount('maximum_cumulative_win_coins')}
      </p>
    </div>
  );
}
