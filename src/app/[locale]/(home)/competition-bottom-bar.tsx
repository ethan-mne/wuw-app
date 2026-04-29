'use client';

import { Timer } from '@/components/timer';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import type { CompetitionInterface } from '@/lib/interfaces';
import { formatPrice } from '@/lib/formaters';
import { Right } from '@/components/icons';
import { useTranslations } from 'next-intl';

export function CompetitionBottomBar({
  competition,
}: Readonly<{
  competition: CompetitionInterface;
}>) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const Thome = useTranslations('home');

  // Prepare data for rendering
  const ticketsLeft = `${competition.total_tickets}`;
  const watchValue = formatPrice(competition.price);
  const ticketPrice = formatPrice(competition.ticket_price);

  const isClosed = competition.remaining_tickets === 0;

  const data = [
    {
      label: isDesktop ? Thome('maxTickets') : Thome('max_tickets'),
      value: ticketsLeft,
    },
    { label: Thome('watch_value'), value: watchValue },
    { label: Thome('entry_price'), value: ticketPrice },
  ];

  // Render
  return (
    <>
      {isDesktop ? (
        <div className='flex w-full flex-col bg-[#1D1B1C]'>
          <div className='flex items-center justify-between h-[62px]'>
            <div className='flex-1 flex flex-col items-center'>
              <Timer start_date={competition.end_date} className='mb-1' />
              <p className='text-[10px] text-white/80 italic'>
                {Thome('all_sold')}
              </p>
            </div>
            {data.map((item, index) => (
              <div
                key={index}
                className='flex h-full flex-1 items-center justify-around overflow-hidden'
              >
                <Separator orientation='vertical' className='h-4/5 bg-white ' />
                <div className='flex justify-center items-center gap-[15px] flex-1  overflow-hidden'>
                  <p className='text-white text-[20px] font-bold -tracking-[0.06em] truncate'>
                    {item.label}
                  </p>
                  <p className='text-secondary text-[20px] font-bold -tracking-normal truncate '>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}

            {isClosed ? (
              <div
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  ' inline-flex h-full flex-1 items-center justify-center gap-2 rounded-none border-none bg-red-500  hover:bg-red-600 ',
                )}
              >
                <p className='text-center text-white text-[16px] -tracking-[0.03em]'>
                  {Thome('tickets_sold_out')}
                </p>
              </div>
            ) : (
              <Link
                href={`/competitions/${competition.id}`}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'inline-flex h-full flex-1 items-center justify-center gap-4   rounded-none border-none bg-primary hover:bg-primary',
                )}
              >
                <p className='text-center text-white text-[16px] -tracking-[0.03em]'>
                  {Thome('get_your_ticket')}
                </p>
                <Right className='mt-1 h-6 w-6' />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className='mb-6 flex flex-col justify-start gap-[20px] pl-4'>
          <div className='flex flex-col items-start p-0'>
            <Timer start_date={competition.end_date} className='mb-1' />
            <p className='text-[10px] text-white/80 italic'>
              {Thome('all_sold')}
            </p>
          </div>
          <div className='flex gap-4'>
            {data.map((item, index) => (
              <div key={index} className='flex h-full items-center gap-2'>
                <Separator
                  orientation='vertical'
                  className='h-4/5 bg-secondary'
                />
                <div className='flex flex-col'>
                  <p className='text-[26px] font-bold text-white'>
                    {item.value}
                  </p>
                  <p className='text-[13px] font-normal text-white'>
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {isClosed ? (
            <div
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'inline-flex w-1/2 items-center justify-between gap-2 border-b p-0 hover:bg-transparent',
              )}
            >
              <p className='text-center text-[20px] font-bold text-white'>
                {Thome('tickets_sold_out')}
              </p>
            </div>
          ) : (
            <Link
              href={`/competitions/${competition.id}`}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'inline-flex w-1/2 items-center justify-between gap-2 border-b-2 p-0 hover:bg-transparent rounded-none pb-[17px]',
              )}
            >
              <p className='text-center text-[20px] font-bold text-white'>
                {Thome('enter_now')}
              </p>
              <ArrowRightIcon
                className='mt-1 h-[30px] w-[30px] '
                size={10}
                color='white'
              />
            </Link>
          )}
        </div>
      )}
    </>
  );
}

export function CompetitionBottomBarVersionTwo({
  competition,
}: Readonly<{
  competition: CompetitionInterface;
}>) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const Thome = useTranslations('home');
  const ticketsLeft = `${competition.total_tickets}`;
  const watchValue = formatPrice(competition.price);
  const ticketPrice = formatPrice(competition.ticket_price);
  const isClosed =
    competition.remaining_tickets === 0 ||
    competition.status === 'COMPLETED';

  const data = [
    {
      label: isDesktop ? Thome('maxTickets') : Thome('max_tickets'),
      value: ticketsLeft,
    },
    { label: Thome('watch_value'), value: watchValue },
    { label: Thome('entry_price'), value: ticketPrice },
  ];
  return (
    <>
      {isDesktop ? (
        <div className='w-full   '>
          <div className='px-[22px] w-full'>
            <Separator orientation='horizontal' className='bg-secondary/15 ' />
          </div>
          <div className='w-full  h-[91px]  pt-[24px] pb-[28px] overflow-hidden '>
            <div className='flex justify-between items-center  h-full '>
              <div className='flex flex-col p-0 pl-[22px]'>
                <Timer start_date={competition.end_date} className='mb-1' />
                <p className='text-[12px] text-white/80 italic'>
                  {Thome('all_sold')}
                </p>
              </div>
              <div className='w-[258px] flex  h-full gap-[38px]'>
                {data.slice(1).map((item, index) => (
                  <div
                    key={index}
                    className='w-full flex h-full items-center gap-3 leading-none '
                  >
                    <Separator
                      orientation='vertical'
                      className='h-full bg-secondary'
                    />
                    <div className='flex flex-col '>
                      <p className='text-[24px] font-bold text-secondary truncate'>
                        {item.value}
                      </p>
                      <p className='text-[16px] font-normal text-white truncate'>
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className='w-full border-t border-t-secondary/15 flex  items-center h-[60px]'>
            <div className='w-full h-full flex flex-row justify-between items-center '>
              <div className='flex items-baseline gap-[9px] pl-[22px] truncate'>
                <p className='text-[20px] font-bold text-secondary'>
                  {data[0]?.value}
                </p>
                <p className='text-[16px] font-normal text-white'>
                  {data[0]?.label}
                </p>
              </div>
              {isClosed ? (
                <div
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'max-w-[258px] inline-flex h-full flex-1 items-center justify-center gap-2 rounded-none border-none bg-red-500  hover:bg-red-600 ',
                  )}
                >
                  <p className='text-center text-white text-[16px] -tracking-[0.03em] font-bold'>
                    {Thome('tickets_sold_out')}
                  </p>
                </div>
              ) : (
                <Link
                  href={`/competitions/${competition.id}`}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'max-w-[258px] inline-flex h-full flex-1 items-center justify-center gap-4   rounded-none border-none bg-primary hover:bg-primary',
                  )}
                >
                  <p className='text-center text-white text-[16px] -tracking-[0.03em] font-bold'>
                    {Thome('get_your_ticket')}
                  </p>
                  <Right className='mt-1 h-6 w-6' />
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className='w-full px-4 pb-[22px] '>
          <div className='flex flex-col  h-[220px]'>
            <div className='flex flex-col p-0'>
              <Timer start_date={competition.end_date} className='mb-1' />
              <p className='text-[12px] text-white/80 italic text-center'>
                {Thome('all_sold')}
              </p>
            </div>
            <div className='flex flex-row gap-[17px] mt-[22px] '>
              {data.map((item, index) => (
                <div
                  key={index}
                  className='flex h-full items-center gap-[15px] leading-normal  '
                >
                  <Separator
                    orientation='vertical'
                    className='h-full bg-secondary hidden xs:block'
                  />
                  <div className='flex flex-col '>
                    <p className='text-[24px] font-bold text-secondary truncate '>
                      {item.value}
                    </p>
                    <p className='text-[16px] font-normal text-white truncate'>
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className='w-full mt-[22px]'>
              {isClosed ? (
                <div
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full inline-flex h-[62px] flex-1 items-center justify-center gap-2 rounded-[5px] border-none bg-red-500  hover:bg-red-600 ',
                  )}
                >
                  <p className='text-center text-white text-[18px] -tracking-[0.03em] font-bold'>
                    {Thome('tickets_sold_out')}
                  </p>
                </div>
              ) : (
                <Link
                  href={`/competitions/${competition.id}`}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full  inline-flex h-[62px]  items-center justify-center gap-4  border-none bg-primary hover:bg-primary  rounded-[5px]',
                  )}
                >
                  <p className='text-center text-white text-[18px] -tracking-[0.03em] font-bold'>
                    {Thome('get_your_ticket')}
                  </p>
                  <Right className='mt-1 h-6 w-6' />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
