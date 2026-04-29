import type { historyType } from '@/lib/types';
import { DateFormater } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

/*  eslint-disable  */
export function HistoryCompetitionList({ history }: { history: historyType }) {
  const Thistory = useTranslations('history');

  return (
    <div className='flex flex-col gap-[24px] md:gap-[22px] px-1 md:p-0'>
      {history.length > 0 ? (
        history.map((comp, index) => (
          <HistoryCompetitionItem
            key={comp.id}
            history={comp as historyType[number]}
            index={index}
          />
        ))
      ) : (
        <p className='px-3 md:p-0'> {Thistory('you_havent_ordered_yet')}</p>
      )}
    </div>
  );
}

function HistoryCompetitionItem({
  history,
  index,
}: {
  history: historyType[0];
  index: number;
}) {
  const endDate = DateFormater(
    history?.Ticket[0]?.Competition.end_date ?? new Date(),
  );
  const orderDate = DateFormater(history?.createdAt ?? new Date());
  const ticket_count = history?._count.Ticket ?? 0;
  const coins = Math.min(ticket_count * 10, 100);
  const watchImg =
    history?.Ticket[0]?.Competition.Watches?.images_url[0]?.url ?? '';
  const compName = history?.Ticket[0]?.Competition.name ?? '';

  const Tcompetition = useTranslations('competition');
  const Thistory = useTranslations('history');

  return (
    <div className='w-full h-[123px] md:h-[148px]   bg-background shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px] px-[13px] md:px-[25px] '>
      <div className='w-full h-full  flex items-center  overflow-hidden'>
        <Image
          src={watchImg}
          alt={compName}
          width={0}
          height={0}
          sizes='100vw'
          className='w-[70px] h-[70px]  md:w-[96px] md:h-[96px] object-cover aspect-square'
        />
        <div className='ml-[8px] md:ml-[20px] flex justify-between items-center w-full h-[70px]  md:h-[96px] overflow-hidden leading-tight md:leading-normal'>
          <div className='flex flex-col justify-center  h-full overflow-hidden '>
            <p className='text-[#898989] text-[13px] md:text-[16px] font-bold  -tracking-[0.05em]'>
              Competition #{index < 10 ? `0${index + 1}` : index + 1}
            </p>
            <p className='text-foreground text-[12px] xs:text-[15px] md:text-[18px]  font-bold truncate -tracking-[0.03em] '>
              {compName}
            </p>
            <div className='md:hidden'>
              <div className='flex flex-col '>
                <p className='text-[#898989] text-[13px] md:text-[16px] font-bold -tracking-[0.05em]'>
                  {Thistory('gain')}
                </p>
              </div>
              {/* We don't store the winning order only the name of the winner
               {competition.winner ? (
                <div className='flex flex-row items-center gap-1'>
                  <p className='uppercase text-[12px] xs:text-[15px] md:text-[18px] font-bold text-foreground'>
                    winner
                  </p>
                  <p className='font-medium text-[12px] xs:text-[14px] text-[#898989]'>
                    Watch Value: {formatPrice(competition.price)}
                  </p>
                </div>
              ) : ( */}
              <p className=' text-foreground font-bold text-[18px]'>
                {coins} Wincoins
              </p>
            </div>
            <div className='hidden md:flex'>
              <p className='text-[#898989] font-medium text-[12px] md:text-[16px] -tracking-[0.05em]'>
                {ticket_count} {Tcompetition('tickets')}
              </p>
            </div>
          </div>
          <div className='flex  md:hidden flex-col  h-full  items-end gap-4'>
            <div className='flex flex-col items-end gap-1'>
              <p className='text-[#898989] font-medium text-[12px] -tracking-[0.05em]'>
                {Thistory('ordered')}: {orderDate}
              </p>
            </div>
            <p className='text-[#898989] font-medium text-[12px] -tracking-[0.05em]'>
              {ticket_count} {Tcompetition('tickets')}
            </p>
          </div>
          <div className='hidden md:flex flex-col gap-2'>
            <div className='flex flex-col items-end gap-1'>
              <p className='text-[#898989] font-medium text-[14px] -tracking-[0.05em]'>
                {Thistory('ordered')}: {orderDate}
              </p>
            </div>
            <div className='flex flex-col'>
              <div className='flex flex-col '>
                <p className='text-[#898989] text-[13px] md:text-[16px] font-bold -tracking-[0.05em]'>
                  Gain
                </p>
              </div>
              {/* {competition.winner ? (
                <div className='flex flex-col  '>
                  <p className='uppercase text-[12px] xs:text-[15px] md:text-[18px] font-bold text-foreground'>
                    winner
                  </p>
                  <p className='font-medium text-[12px] xs:text-[14px] text-[#898989]'>
                    Watch Value: {formatPrice(competition.price)}
                  </p>
                </div>
              ) : ( */}
              <p className='text-foreground font-bold text-[18px] -tracking-[0.03em]'>
                {coins} Wincoins
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const CompetitionHistoryText = () => {
  const Thistory = useTranslations('history');
  return (
    <h1 className='text-foreground text-[20px] md:text-[24px] font-bold uppercase -tracking-[0.05em] px-4 md:p-0'>
      {Thistory('your_competition_history')}
    </h1>
  );
};
