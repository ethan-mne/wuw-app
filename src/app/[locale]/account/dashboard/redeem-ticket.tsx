'use client';

import { TicketStar } from '@/components/icons';
import { Timer } from '@/components/timer';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatPrice } from '@/lib/formaters';
import type { CompetitionInterface } from '@/lib/interfaces';
import { api } from '@/trpc/react';
import { AvatarFallback } from '@radix-ui/react-avatar';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { type MouseEventHandler, useState } from 'react';
import { toast } from 'sonner';

interface RedeemTicketProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentCompetitions: CompetitionInterface[];
}

export function RedeemTicket({
  open,
  setOpen,
  currentCompetitions,
}: RedeemTicketProps) {
  const [showCongrats, setShowCongrats] = useState(false);
  const [selectectedCompetition, setSelectedCompetition] =
    useState<CompetitionInterface | null>(null);

  const t = useTranslations('account');
  const { isLoading: isLoading, mutateAsync: redeemFreeTicket } =
    api.Order.redeemFreeTicket.useMutation();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='w-full  max-w-[409px] h-[623px]  p-0 border-none shadow-none bg-background !rounded-[24px] py-[38px] px-[17px] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] '>
        {!showCongrats ? (
          <div className='w-full h-full flex flex-col  gap-[40px]'>
            <h1 className='text-[20px] h-auto -tracking-[0.05em] font-bold text-foreground leading-[31px]'>
              {t.rich('redeem.which_competition', {
                freeTicket: (chunks) => <span className='text-secondary'>{chunks}</span>,
              })}
            </h1>
            <div
              className={`w-full h-full flex flex-col  gap-[36px]  ${isLoading ? 'opacity-60' : ''} `}
            >
              {currentCompetitions.length > 0 ? (
                currentCompetitions.map((comp, index) => (
                  <Competition
                    key={comp.id}
                    competition={comp}
                    index={index + 1}
                    isLoading={isLoading}
                    onClick={async () => {
                      try {
                        setSelectedCompetition(comp);
                        await redeemFreeTicket(comp.id);
                        toast.success(t('redeem.success'));
                        setShowCongrats(true);
                      } catch (error) {
                        toast.error(t('redeem.error'));
                      }
                    }}
                  />
                ))
              ) : (
                <p>{t('redeem.no_competitions_found')}</p>
              )}
            </div>
          </div>
        ) : (
          <div className='w-full h-full flex flex-col items-center'>
            <div className='flex justify-center items-center shadow-[4px_-3.81px_28.55px_rgba(0,0,0,0.1)] bg-background w-[64px] h-[64px] rounded-[16px]'>
              <TicketStar className='' />
            </div>
            <h1 className='text-[16px] -tracking-[0.05em] font-bold mt-[24px]'>
              {t('redeem.congratulations')}
            </h1>
            <p className='w-[279px] text-[16px] -tracking-[0.05em] font-medium leading-[25px] text-center text-[#898989] mt-[35px]'>
              {t('redeem.congrats_message', { name: selectectedCompetition?.name })}
            </p>
            <span className='text-[16px] -tracking-[0.05em] font-medium leading-[25px] text-center text-[#898989] mt-[37px]'>
              {t('redeem.best_of_luck')}
            </span>
            <Avatar className='mt-[37px] h-[54px] w-[54px] '>
              <AvatarImage src='/new-images/default-author.png' />
              <AvatarFallback>WIU</AvatarFallback>
            </Avatar>
            <p className='mt-[20px] text-[16px] -tracking-[0.03em] font-bold '>
              {t('redeem.winuwatch_family')}
            </p>
            <Link
              href='/'
              className='w-full h-[49px] inline-flex justify-center items-center rounded-[2.51px] bg-foreground hover:bg-foreground mt-[43px]'
            >
              <span className='text-background text-[16px] font-bold -tracking-[0.03em]'>
                {t('redeem.go_back_home')}
              </span>
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function Competition({
  competition,
  index,
  onClick,
  isLoading,
}: {
  competition: CompetitionInterface;
  index: number;
  onClick: MouseEventHandler<HTMLButtonElement>;
  isLoading: boolean;
}) {
  const t = useTranslations('account');
  const data = [
    { label: t('redeem.max_tickets'), value: competition.total_tickets },
    { label: t('redeem.watch_value'), value: formatPrice(competition.price) },
    // {
    //     label: 'Draw Date',
    //     value: formatDate(competition.end_date, 'dd/MM/yyyy'),
    // },
  ];
  return (
    <div className='w-full max-w-[375px] flex flex-col  overflow-hidden'>
      <div className='flex pl-3 '>
        <Timer
          className='text-foreground'
          separatorStyle='bg-foreground'
          start_date={competition.end_date}
        />
      </div>
      <div className='w-full flex justify-between items-center h-[103px]  bg-background shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px]  py-[18px] px-[11px] mt-[8px]'>
        <Image
          src={competition.Watches?.images_url[0]?.url ?? ''}
          alt={competition.name ?? ''}
          width={0}
          height={0}
          sizes='100vw'
          className=' w-[66px] h-[66px]  object-cover aspect-square'
        />
        <div className='ml-[8px] flex justify-between items-center w-full h-[66px]   overflow-hidden'>
          <div className='h-full w-3/4 flex flex-col   overflow-hidden  '>
            <div>
              <p className='text-[#898989] text-[13px]  -tracking-[0.05em] font-bold  leading-none '>
                {t('redeem.competition_number', { index })}
              </p>
              <p className=' text-[15px]  -tracking-[0.03em] font-bold leading-none mt-[3px] truncate  '>
                {competition.name}
              </p>
            </div>

            <div className='flex gap-x-[14px]   flex-wrap'>
              {data.map((item, index) => (
                <div className='flex flex-row gap-1 items-baseline' key={index}>
                  <p className='font-medium  text-[12px] md:text-[10.75px] -tracking-normal  text-[#898989]   '>
                    {item.label}
                  </p>
                  <p className='text-[12px]  -tracking-[0.03em] font-medium text-[#898989]  '>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className='flex flex-col justify-start   items-end w-1/4  h-full overflow-hidden'>
            <p className='text-[#898989] text-[13px]   font-bold  -tracking-[0.05em] leading-none'>
              {t('redeem.ticket_price')}
            </p>
            <p className='text-[20px]  -tracking-normal font-bold text-foreground'>
              {formatPrice(competition.ticket_price)}
            </p>
          </div>
        </div>
      </div>
      <Button
        className='w-full h-[49px] inline-flex justify-center items-center gap-2 rounded-[2.51px] bg-foreground hover:bg-foreground mt-[27px]'
        onClick={onClick}
        disabled={isLoading}
      >
        {isLoading && (
          <svg
            className='animate-spin h-4 w-4 text-background'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
          </svg>
        )}
        <span className='text-background text-[16px] font-bold -tracking-[0.03em]'>
          {t('redeem.use_your_ticket')}
        </span>
      </Button>
    </div>
  );
}
