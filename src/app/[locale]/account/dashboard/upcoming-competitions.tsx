import type { CompetitionInterface } from '@/lib/interfaces';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import static_competitions from '@/lib/static-upcoming-competitions';
export function UpcomingCompetitions({
  competition,
  className,
}: {
  competition: CompetitionInterface[];
  className?: string;
}) {
  const Thome = useTranslations('home');
  // USING STATIC DATA FOR NOW
  return (
    <div className={cn('flex flex-col gap-[39px]', className)}>
      <h1 className='text-foreground text-[48px] font-bold -tracking-[0.03em]'>
        {Thome('next')}{' '}
        <span className='text-secondary'>{Thome('competitions1')}</span>
      </h1>
      <div className='flex flex-wrap gap-4 items-baseline'>
        {static_competitions.map((comp, i) => (
          <CompetitionItem key={i} {...comp} />
        ))}
      </div>
    </div>
  );
}

function CompetitionItem(competition: CompetitionInterface) {
  return (
    <div className='w-[100px]  h-[153px] flex flex-col  justify-center items-center  gap-[25px] rounded-full'>
      <div className='w-[100px] h-[100px] shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px] rounded-full'>
        <Image
          src={
            competition.Watches?.images_url[0]?.url ?? '/images/placeholder.png'
          }
          alt={competition.Watches?.brand + ' ' + competition.Watches?.model}
          width={0}
          height={0}
          sizes='100vw'
          className='object-contain w-full h-full rounded-full'
        />
      </div>
      <p className='w-5/6  font-medium text-[14px] text-foreground text-center'>
        {competition.Watches?.brand}
      </p>
    </div>
  );
}
