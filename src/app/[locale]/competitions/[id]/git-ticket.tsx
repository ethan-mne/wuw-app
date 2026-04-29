import { Gift, Right } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { GiftTicketDetails } from './gift-ticket-details';
import { useTranslations } from 'next-intl';

export function GiftTicket({ className }: { className?: string }) {
  const [open, setOPen] = useState<boolean>(false);
  const Taccount = useTranslations('account');
  const Tcomp = useTranslations('competition');
  return (
    <>
      <div
        className={cn(
          'w-full h-auto md:h-[111px] bg-[#1D1B1C] bg-opacity-70 rounded-[12px] flex p-3 gap-2 ',
          className,
        )}
      >
        <div>
          <Gift className='w-[67px] h-[67px]' />
        </div>
        <div className='w-full overflow-hidden'>
          <h1 className='uppercase font-bold text-[20px]  text-white -tracking-[0.03em]'>
            <span className='text-[#F203BE]'>
              {Taccount('be_the_lucky_charm')}
            </span>
            {Taccount('for_your_special_one')}
          </h1>
          <div className='w-full flex flex-col md:flex-row  md:items-center md:justify-between'>
            <p className='w-full md:w-3/6 text-[#C5C5C5] font-medium text-[12px] md:text-[14px] -tracking-[0.03em] leading-[24px] '>
              {Tcomp('present_ticket_as_gift')}
            </p>
            <Button
              onClick={() => {
                setOPen(true);
              }}
              type='button'
              className='bg-transparent  hover:bg-transparent m-0 p-0 flex gap-4 border-b border-b-white rounded-none w-fit'
            >
              <span className='text-[15px] font-bold -tracking-[0.04em]'>
                {Tcomp('ticket_as_gift')}
              </span>
              <Right className='h-6 w-6  mt-1  text-[#F203BE] ' />
            </Button>
          </div>
        </div>
      </div>
      <GiftTicketDetails open={open} setOpen={setOPen} />
    </>
  );
}
