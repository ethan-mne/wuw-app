import { cn } from '@/lib/utils';
import { WinnersCarousel } from './winners-carousel';
import { SectionTitle } from '@/components/section-title';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/formaters';
import type { PublicWinner } from '@/server/public-home-data';

const WinnerTitle = ({ amountWon }: { amountWon: number }) => {
  const Thome = useTranslations('home');
  const Twinners = useTranslations('winners');

  return (
    <SectionTitle
      leftSideStyle='pr-0  lg:pr-30 xl:pr-30'
      subtitle={Twinners('we_have_away', {
        value: amountWon ? formatCurrency(amountWon) : '...',
      })}
    >
      <p className='text-foreground -tracking-[0.05em] font-normal pb-4'>
        {Thome('wuw')}
      </p>
      <p className='text-foreground -tracking-[0.05em]'>
        {Thome('our_goal_is')}
      </p>
      <p className='text-foreground -tracking-[0.05em]'>
        {Thome('for')}
        <span className='text-primary'>{Thome('everyone')}</span>
      </p>
      <p className='text-primary -tracking-[0.05em]'>{Thome('to_win')}</p>
      <p className='text-foreground text-[34px] font-normal'>
        {Thome('the_watch_of_their_dreams')}
      </p>
    </SectionTitle>
  );
};

export function Winners({
  amountWon,
  className,
  winners,
}: Readonly<{
  amountWon: number;
  className?: string;
  winners: PublicWinner[];
}>) {
  return (
    <div className={cn('flex flex-col  gap-[80px] md:gap-[104px]', className)}>
      <div className='w-full md:w-4/5 lg:self-center'>
        <WinnerTitle amountWon={amountWon} />
      </div>
      <div className='flex items-center justify-center'>
        <WinnersCarousel winners={winners} />
      </div>
    </div>
  );
}
