import { Play, Live } from '@/components/icons';
import { Timer } from '@/components/timer';
import type { liveCompetitionType } from '@/lib/types';
import { type Competition } from '@prisma/client';
import { useTranslations } from 'next-intl';
export function Competition({
  competition,
}: {
  competition?: liveCompetitionType[0];
}) {
  const Taccount = useTranslations('account');
  if (!competition) return null;
  else {
    const watchImg = competition.img_url;
    const endDate = competition.end_date;
    const ticketCount = Number(competition.ticket_count);
    return (
      <div
        className='w-full h-[440px] flex flex-col justify-between bg-cover bg-center'
        style={{
          backgroundImage: `url(${watchImg})`,
        }}
      >
        <div className='h-10 w-full bg-background/10 backdrop-blur-xl  supports-[backdrop-filter]:bg-background/20 flex justify-center items-center gap-3'>
          <Play className='w-4 h-4 fill-white ' />
          <p className='uppercase text-[16px] font-bold text-white'>
            {Taccount('live_access')}
          </p>
          <Live className='w-3 h-3 fill-red-400' />
        </div>
        <div className='w-full flex flex-row justify-around items-center bg-foreground h-[79px]'>
          <Timer start_date={endDate} />
          <p className='text-secondary text-[15px] xs:text-[18px] '>
            {Taccount('you_have')} {ticketCount}{' '}
            {ticketCount > 1 ? 'tickets' : 'ticket'}{' '}
            {Taccount('for_this_competition')}
          </p>
        </div>
      </div>
    );
  }
}
