import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  CompetitionBottomBar,
  CompetitionBottomBarVersionTwo,
} from './competition-bottom-bar';
import type { CompetitionInterface } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

export function Competition({
  competition,
}: {
  competition: CompetitionInterface;
}) {
  const Thome = useTranslations('home');
  return (
    <div
      className='relative flex h-[700px] w-full items-end justify-center border-b-4 border-b-secondary bg-cover bg-center md:border-none'
      style={{
        backgroundImage: `url(${
          competition?.Watches?.images_url?.[0]?.url ?? 'defaultImageUrl HERE'
        })`,
      }}
    >
      <div className='absolute inset-0 bg-gradient-to-bl from-black/0 to-black'></div>
      <div className='relative flex h-full w-full flex-col justify-end'>
        <div className='mb-4 flex flex-col  pl-4 md:pl-8 lg:mb-8 '>
          <h1 className='text-[26px] md:text-[67px] font-bold uppercase text-background -tracking-[0.07em]'>
            {Thome('win_a')}{' '}
            <span className='text-stone-200'>{competition.name}</span>
          </h1>

          <span className='text-[16px] md:text-[26px] font-normal text-stone-200   capitalize   -tracking-[0.05em] md:-tracking-[0.07em]	'>
            <span className=''>{competition.Watches?.brand + ' '}</span>
            {competition.Watches?.model}
          </span>
        </div>
        {/* bottom competition info  */}
        <CompetitionBottomBar competition={competition} />
      </div>
    </div>
  );
}

export function CompetitionVersionTwo({
  competition,
  priority = false,
}: {
  competition: CompetitionInterface;
  priority?: boolean;
}) {
  const Thome = useTranslations('home');
  const isSoldOut =
    competition.remaining_tickets === 0 ||
    competition.status === 'COMPLETED';

  return (
    <div className='w-full h-[854px] md:h-[825px] border-[#DBE5E0] border overflow-hidden'>
      <div className='relative w-full h-[472px] md:h-[552px]'>
        <Image
          src={
            competition?.Watches?.images_url?.[0]?.url ?? 'defaultImageUrl HERE'
          }
          alt={competition.name}
          fill
          sizes='(min-width: 1280px) 50vw, 100vw'
          className={cn(
            'object-cover object-center w-full h-full',
            isSoldOut && 'brightness-50',
          )}
          priority={priority}
          fetchPriority={priority ? 'high' : 'auto'}
        />
        {isSoldOut && (
          <div className='absolute inset-0 flex items-center justify-center z-10'>
            <span className='bg-red-600 text-white text-[36px] md:text-[48px] font-bold px-8 py-3 -tracking-[0.03em] rotate-[-12deg] shadow-lg'>
              {Thome('sold_out')}
            </span>
          </div>
        )}
      </div>
      <div className='w-full h-[382px] md:h-[273px] bg-foreground flex flex-col justify-between '>
        <div className='flex h-full md:h-[120px]  flex-col justify-between px-[22px] py-[25px]  '>
          <div className='flex flex-col '>
            <h2 className='text-[28px]  font-bold uppercase text-background -tracking-[0.03em] truncate'>
              {competition.name}
            </h2>
            <p className='text-[20px] -tracking-normal font-normal text-background truncate'>
              {competition.Watches?.brand + '' + competition.Watches?.model}
            </p>
          </div>
        </div>
        <CompetitionBottomBarVersionTwo competition={competition} />
      </div>
    </div>
  );
}
