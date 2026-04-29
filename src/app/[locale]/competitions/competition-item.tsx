import { Right } from '@/components/icons';
import { Timer } from '@/components/timer';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/formaters';
import type { CompetitionInterface } from '@/lib/interfaces';
import { cn } from '@/lib/utils';
import { formatDate } from 'date-fns';
import { ArrowRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

export function CompetitionItem({
  competition,
  index,
}: {
  competition: CompetitionInterface;
  index: number;
}) {
  const Thome = useTranslations('home');
  const Tcompetition = useTranslations('competition');
  const data = [
    { label: Thome('max_tickets'), value: competition.total_tickets },
    { label: Thome('watch_value'), value: formatPrice(competition.price) },
    {
      label: Thome('draw_date'),
      value: formatDate(competition.end_date, 'dd/MM/yyyy'),
    },
  ];
  const isClosed = competition.remaining_tickets === 0;
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex pl-3 md:pl-0'>
        <Timer
          className='text-foreground'
          separatorStyle='bg-foreground'
          start_date={competition.end_date}
        />
      </div>
      <Link
        href={isClosed ? '/competitions' : `/competitions/${competition.id}`}
        className='md:pointer-events-none'
      >
        <div className='w-full flex justify-between items-center h-[103px] md:h-[150px] bg-background shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px]  py-[22px] px-[11px] md:px-[22px]   mt-[8px] md:mt-[22px] '>
          <Image
            src={competition.Watches?.images_url[0]?.url ?? ''}
            alt={competition.name ?? ''}
            width={0}
            height={0}
            sizes='100vw'
            className=' w-[66px] h-[66px]  md:w-[96px] md:h-[96px] object-cover aspect-square'
          />
          <div className='ml-[8px] md:ml-[20px] flex justify-between items-center w-full h-[66px]  md:h-[96px] overflow-hidden'>
            <div className='flex flex-col md:justify-between  overflow-hidden h-full w-3/4 '>
              <div>
                <p className='text-[#898989] text-[13px] md:text-[16px] -tracking-[0.05em] font-bold  leading-none '>
                  {Thome('competition')} #{index}
                </p>
                <p className='text-[15px] truncate md:text-[18px]  -tracking-[0.03em] font-bold leading-none mt-[3px] '>
                  {competition.name}
                </p>
              </div>

              <div className='flex gap-x-[14px] md:gap-2  flex-wrap'>
                {data.map((item, index) => (
                  <div className='flex md:gap-3' key={index}>
                    <Separator
                      orientation='vertical'
                      className='bg-secondary h-4/5  text-foreground hidden md:flex  self-center'
                    />
                    <div className='flex flex-row gap-1 items-baseline md:items-start md:gap-0 md:flex-col '>
                      <p className='text-[12px]  md:text-[21.5px] -tracking-[0.03em] md:-tracking-normal font-medium md:font-bold text-[#898989] md:text-foreground '>
                        {item.value}
                      </p>
                      <p className='font-medium md:font-normal text-[12px] md:text-[10.75px] -tracking-normal  text-[#898989] md:text-foreground  order-first md:order-last'>
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='flex flex-col justify-start md:justify-center  items-end w-1/4  h-full overflow-hidden'>
              <p className='text-[#898989] text-[13px]  md:text-[24.7px] font-bold  -tracking-[0.05em]'>
                {Tcompetition('ticket_price')}
              </p>
              <p className='text-[20px] md:text-[38px] -tracking-normal font-bold text-foreground'>
                {formatPrice(competition.ticket_price)}
              </p>
            </div>
          </div>
        </div>
      </Link>
      {isClosed ? (
        <div
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'w-[300px] xs:w-[334px] h-[58px]  hidden md:inline-flex border-none rounded-[5px] bg-red-500 text-background hover:bg-red-500  	hover:text-background  p-0  self-end mt-[25px] ',
          )}
        >
          <div className='flex h-full w-full items-center justify-center gap-[16px] rounded-[5px] '>
            <span className='text-[20px] -tracking-[0.03em] font-bold '>
              {Thome('tickets_sold_out')}
            </span>
          </div>
        </div>
      ) : (
        <Link
          target='_blank'
          rel='noreferrer'
          href={isClosed ? '/competitions' : `/competitions/${competition.id}`}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'w-[300px] xs:w-[334px] h-[58px]  hidden md:inline-flex border-none rounded-[5px] bg-primary text-background hover:bg-primary  	hover:text-background  p-0  self-end mt-[25px]',
          )}
        >
          <div className='flex h-full w-full items-center justify-center gap-[16px] rounded-[5px] '>
            <span className='text-[20px] -tracking-[0.03em] font-bold '>
              {Tcompetition('enter_this_competition')}
            </span>
            <Right className='mt-0.5 h-[27px] w-[27px]  ' />
          </div>
        </Link>
      )}
    </div>
  );
}
