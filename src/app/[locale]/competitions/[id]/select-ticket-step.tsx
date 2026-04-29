'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/store/use-cart';
import { packs } from '@/data/packs';
import { calculateTotal, cn, calculateOddsString } from '@/lib/utils';
import { useCheckoutSteps } from '@/store/use-checkout-steps';
import { GoodToKnow } from './good-to-know';
import { AskedQuestions } from '@/components/asked-questions';
import { TicketQuantity } from './ticket-quantity';
import type { CompetitionInterface } from '@/lib/interfaces';
import { formatPrice } from '@/lib/formaters';
import { formatDate } from 'date-fns';
import { useTranslations } from 'next-intl';
import { SwipeAnimatedButton } from '@/components/animated-button';
import { ImageSwitcher } from './image-switcher';
import { toast } from 'sonner';
export function SelectTicketStep({
  competition,
}: Readonly<{
  competition: CompetitionInterface;
}>) {
  const TotalTickets = 10;
  const Thome = useTranslations('home');
  const Tcompetition = useTranslations('competition');
  const watchImages = competition.Watches
    ? competition.Watches.images_url.map((w) => ({
        src: w.url,
      }))
    : [{ src: '/images/placeholder.png' }];

  const data = [
    { label: Thome('watch_value'), value: formatPrice(competition.price) },
    {
      label: Thome('entry_price'),
      value: formatPrice(competition.ticket_price),
    },
    {
      label: Thome('draw_date'),
      value: formatDate(competition.end_date, 'dd/MM/yyyy'),
      additionalInfo: Thome('all_sold'),
    },
  ];

  const Tcheckout = useTranslations('checkout');

  const { tickets, updateTickets, updateVipPack, vipPack } = useCart();
  const { incStep } = useCheckoutSteps();
  return (
    <div className='w-full flex flex-col items-center gap-3'>
      <div className='w-full flex justify-center items-center '>
        <div className='w-full  flex flex-col gap-3 lg:flex-row '>
          <ImageSwitcher watchImages={watchImages} />
          <div className='flex flex-1 w-full md:w-4/5 flex-col gap-6 pl-4 md:pl-0 '>
            <div className='flex  w-full md:w-4/5 flex-col gap-[40px] '>
              <div className='flex flex-col'>
                <p className='text-[#898989] text-[16px] md:text-[18px] -tracking-[0.03em] font-bold'>
                  Win the
                </p>
                <p className='uppercase text-[24px]  md:text-[28px] -tracking-[0.06em] font-bold'>
                  {competition.Watches?.brand +
                    ' ' +
                    competition.Watches?.model}
                </p>
              </div>
              <div className='flex flex-wrap gap-[26px] md:gap-[51px] '>
                {data.map((item, index) => (
                  <div
                    className='flex items-center gap-[13px]'
                    key={item.value}
                  >
                    <Separator
                      orientation='vertical'
                      className='bg-primary h-full'
                    />
                    <div className='flex flex-col items-baseline md:items-start text-foreground leading-none h-full justify-end '>
                      <p
                        className={cn(
                          'text-[22px] md:text-[32px] font-bold -tracking-normal',
                          {
                            'text-[16px] md:text-[22px]':
                              index === data.length - 1,
                          },
                        )}
                      >
                        {item.value}
                      </p>
                      <p className='font-normal text-[16px] text-[#898989] md:text-foreground -tracking-normal '>
                        {item.label}
                      </p>
                      {item.additionalInfo && (
                        <p className='text-[12px] text-[#898989] mt-1'>
                          {item.additionalInfo}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className='flex  flex-col gap-3'>
                <p className='text-[16px] font-medium md:hidden'>
                  How many Tickets would you like ?
                </p>
                <div className='flex flex-wrap  xl:justify-between gap-[10px] xl:gap-0'>
                  {/* HERE: */}
                  {Array.from({ length: TotalTickets }, (_, i) => (
                    <TicketNumber
                      key={i}
                      active={i + 1 === tickets}
                      number={i + 1}
                      remaining_tickets={competition.remaining_tickets}
                      onClick={() => {
                        updateTickets(i + 1);
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className='flex flex-col gap-3'>
                <p className='text-[16px] text-[#898989]'>VIP Pack</p>
                <div className='flex flex-wrap xl:justify-between gap-3 xl:gap-0'>
                  {packs.map((pack) => (
                    <VipPack
                      key={pack.number}
                      {...pack}
                      active={vipPack === pack.number}
                      remaining_tickets={competition.remaining_tickets}
                      competition_tickets={competition.total_tickets}
                      max_winners={competition.max_winners}
                      onClick={() => {
                        updateVipPack(pack.number);
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className='flex items-baseline gap-4 md:hidden'>
                <TicketQuantity
                  remaining_tickets={competition.remaining_tickets}
                />
                <div className='flex items-baseline gap-2'>
                  <p className='text-[16px] -tracking-normal text-foreground'>
                    {Tcheckout('total').toLowerCase()}:
                  </p>
                  <p className='text-[22px] -tracking-normal font-bold text-foreground'>
                    {formatPrice(
                      calculateTotal(tickets, competition.ticket_price).total,
                    )}
                  </p>
                </div>
              </div>
              <SwipeAnimatedButton
                disabled={tickets < 0}
                text={Tcompetition('continue_to_the_next_step')}
                onClick={() => {
                  if (tickets > 0 && competition.remaining_tickets > 0) {
                    incStep();
                  } else {
                    toast.error('Please select another Competition ');
                  }
                }}
                className='max-xs:-ml-4 max-xs:self-center self-start lg:self-end  mt-[13px] lg:mt-[18px] '
              />
            </div>
          </div>
        </div>
      </div>
      <div className='w-full md:w-4/5 '>
        <GoodToKnow competition={competition} />
        <div className='flex flex-col items-center gap-6 px-4 md:px-0 mt-[80px] md:mt-[104px]'>
          <h1 className='text:[22px] font-bold uppercase text-foreground md:text-[64px] -tracking-[0.05em] text-center'>
            <span className='text-secondary'>Frequently </span> Asked questions
          </h1>
          <AskedQuestions maxToShow={7} />
        </div>
      </div>
    </div>
  );
}

const VipPack = ({
  number,
  percentage,
  active,
  remaining_tickets,
  competition_tickets,
  max_winners,
  onClick,
}: Readonly<{
  number: number;
  percentage: string;
  active: boolean;
  remaining_tickets: number;
  competition_tickets: number;
  max_winners: number;
  onClick: () => void;
}>) => {
  const TCompetition = useTranslations('competition');
  const chance = calculateOddsString(number, competition_tickets, max_winners);
  return (
    <Button
      className={cn(
        'cursor-pointer w-[118px] h-[76px] border bg-white hover:bg-white hover:shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px] flex flex-col justify-center items-center',
        {
          'shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px] hover:shadow border-[#114F33] bg-opacity-50':
            active,
        },
      )}
      disabled={number > remaining_tickets}
      onClick={onClick}
    >
      <span className='text-[14px] text-foreground font-bold -tracking-normal'>
        {number}
      </span>
      <span className='text-[12px] text-[#898989] font-bold -tracking-normal'>
        {percentage} {TCompetition('off').toLowerCase()}
      </span>
      <span className='text-[11px] text-[#898989] font-medium -tracking-normal'>
        {chance} chance to win
      </span>
    </Button>
  );
};

const TicketNumber = ({
  number,
  active,
  remaining_tickets,
  onClick,
}: Readonly<{
  number: number;
  active: boolean;
  remaining_tickets: number;
  onClick: () => void;
}>) => (
  <Button
    className={cn(
      ' cursor-pointer flex justify-center items-center w-10 h-10 bg-white hover:bg-white hover:shadow border',
      {
        'bg-foreground hover:bg-foreground ': active,
      },
    )}
    disabled={number > remaining_tickets}
    onClick={onClick}
  >
    <span
      className={cn('text-[14px] text-foreground -tracking-normal font-bold', {
        'text-secondary text-[18px]': active,
      })}
    >
      {number}
    </span>
  </Button>
);
