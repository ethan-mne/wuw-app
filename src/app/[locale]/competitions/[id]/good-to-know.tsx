'use client';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { CompetitionInterface } from '@/lib/interfaces';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/formaters';
export function GoodToKnow({
  competition,
}: {
  //fix typing cause api will change
  competition: CompetitionInterface;
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const WatchInfo = competition.Watches;
  const watch = {
    brand: WatchInfo?.brand ?? 'Unknown',
    model: WatchInfo?.model ?? 'Unknown',
    'ref Number': WatchInfo?.reference_number ?? 'Unknown',
    movement: WatchInfo?.movement ?? 'Unknown',
    year: WatchInfo?.year_of_manifacture ?? 'Unknown',
    caliber: WatchInfo?.caliber_grear ?? 'Unknown',
    glass: WatchInfo?.glass ?? 'Unknown',
    'bezel Material': WatchInfo?.bezel_material ?? 'Unknown',
    'bracelet Material': WatchInfo?.Bracelet_material ?? 'Unknown',
    papers: `This product comes with full paperwork, a new digital warranty card ${WatchInfo?.has_box ? 'and is fully boxed' : '.'}`,
    'maximum Entries': competition.total_tickets,
    maxwatchwinner: competition.max_winners,
    cash_alternative: competition?.cash_alternative ?? undefined,
  };

  const Tcompetition = useTranslations('competition');

  return (
    <div className='w-full  flex flex-col items-center  gap-[77px] md:gap-[104px] mt-[125px] '>
      <h1 className='uppercase text-[40px] md:text-[64px]  font-bold text-foreground -tracking-[0.05em]'>
        <span className='text-secondary'>{Tcompetition('good')} </span>{' '}
        {Tcompetition('to_know')}
      </h1>
      <div className='w-full h-[742px] md:h-[436px] relative '>
        <div
          className='w-full h-full flex items-center justify-center bg-center bg-cover bg-no-repeat '
          style={{
            backgroundImage: `url(/new-images/good-to-know.png)`,
          }}
        >
          <div className='w-full h-full flex flex-col pt-[38px] pl-4 md:pl-[38px] gap-[44px]'>
            <h1 className='uppercase text-white text-[20px] md:text-[24px] -tracking-[0.05em] font-bold leading-none'>
              {Tcompetition('watch_and_competition_info')}
            </h1>
            {isDesktop ? (
              <div className='grid grid-cols-1  md:grid-cols-4 gap-x-[48px] h-full -tracking-normal leading-none'>
                <div className='col-span-1 flex h-4/5 flex-col gap-[20px] '>
                  <div className='flex flex-col gap-y-[5px] '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal -tracking-normal'>
                      {Tcompetition('brand').toLowerCase()}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch.brand}
                    </p>
                  </div>
                  <div className='flex flex-col  gap-y-[5px] '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal -tracking-normal'>
                      {Tcompetition('model').toLowerCase()}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch.model}
                    </p>
                  </div>
                  {watch.cash_alternative ? (
                    <div className='flex flex-col  gap-y-[5px] '>
                      <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal -tracking-normal'>
                        {Tcompetition('cash_alternative').toLowerCase()}
                      </h2>
                      <p className='text-[16px] text-white uppercase font-bold'>
                        {formatCurrency(watch.cash_alternative)}
                      </p>
                    </div>
                  ) : null}
                  <div className='flex flex-col  gap-y-[5px] '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal '>
                      {Tcompetition('refnumber')}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch['ref Number']}
                    </p>
                  </div>
                  <div className='flex flex-col  gap-y-[5px] '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('mov').toLowerCase()}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch.movement}
                    </p>
                  </div>
                </div>
                <div className='col-span-1 flex h-4/5 flex-col  gap-[20px]'>
                  <div className='flex flex-col  gap-y-[5px]  '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('year')}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch.year}
                    </p>
                  </div>
                  <div className='flex flex-col  gap-y-[5px]  '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('caliber')}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch.caliber}
                    </p>
                  </div>
                  <div className='flex flex-col  gap-y-[5px] '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('glass').toLowerCase()}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch.glass}
                    </p>
                  </div>
                  <div className='flex flex-col  gap-y-[5px] '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('bezelmeterial').toLowerCase()}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch['bezel Material']}
                    </p>
                  </div>
                  <div className='flex flex-col   gap-y-[5px]'>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('bracematerial').toLowerCase()}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch['bracelet Material']}
                    </p>
                  </div>
                </div>
                <div className='col-span-2 flex h-4/5 flex-col w-3/5 '>
                  <div className='flex flex-col  gap-y-[5px] '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('papers')}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold '>
                      {watch.papers}
                    </p>
                  </div>
                  <div className='flex flex-col  gap-y-[5px] mt-[40px]'>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('maximum_entries')}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch['maximum Entries']}
                    </p>
                  </div>
                  <div className='flex flex-col  gap-y-[5px] mt-[20px]'>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('maxwatchwinner').toLowerCase()}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch.maxwatchwinner}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className='flex flex-col justify-between h-4/5 -tracking-normal'>
                {/* 1 */}
                <div className='flex flex-row  gap-4 '>
                  <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                    {Tcompetition('maximum_entries')}
                  </h2>
                  <p className='text-[16px] text-white uppercase font-bold'>
                    {watch['maximum Entries']}
                  </p>
                </div>
                <div className='flex flex-row gap-4 '>
                  <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                    {Tcompetition('maxwatchwinner').toLowerCase()}
                  </h2>
                  <p className='text-[16px] text-white uppercase font-bold'>
                    {watch.maxwatchwinner}
                  </p>
                </div>
                <div className='flex flex-col  '>
                  <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                    {Tcompetition('brand').toLowerCase()}
                  </h2>
                  <p className='text-[16px] text-white uppercase font-bold'>
                    {watch.brand}
                  </p>
                </div>
                <div className='flex flex-col  '>
                  <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                    {Tcompetition('model').toLowerCase()}
                  </h2>
                  <p className='text-[16px] text-white uppercase font-bold'>
                    {watch.model}
                  </p>
                </div>
                {watch.cash_alternative ? (
                  <div className='flex flex-col  '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('cash_alternative').toLowerCase()}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {formatCurrency(watch.cash_alternative)}
                    </p>
                  </div>
                ) : null}
                {/* 2 */}
                <div className='flex flex-row '>
                  <div className='flex basis-3/6 flex-col  '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('refnumber')}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch['ref Number']}
                    </p>
                  </div>
                  <div className='flex basis-3/6 flex-col border-l pl-6 '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal '>
                      {Tcompetition('year')}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch.year}
                    </p>
                  </div>
                </div>
                {/* 3 */}
                <div className='flex flex-col  '>
                  <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                    {Tcompetition('mov').toLowerCase()}
                  </h2>
                  <p className='text-[16px] text-white uppercase font-bold'>
                    {watch.movement}
                  </p>
                </div>
                {/* 4 */}
                <div className='flex flex-row'>
                  <div className='flex basis-3/6 flex-col  '>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('glass').toLowerCase()}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch.glass}
                    </p>
                  </div>
                  <div className='flex  basis-3/6 flex-col  border-l pl-6'>
                    <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                      {Tcompetition('bezelmeterial').toLowerCase()}
                    </h2>
                    <p className='text-[16px] text-white uppercase font-bold'>
                      {watch['bezel Material']}
                    </p>
                  </div>
                </div>
                {/* 5 */}
                <div className='flex flex-col '>
                  <h2 className='text-[14px] text-[#B8B8B8] uppercase font-normal'>
                    {Tcompetition('papers')}
                  </h2>
                  <p className='text-[14px] text-white uppercase font-bold w-3/5 leading-none'>
                    {watch.papers}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
