import { SwipeAnimatedButton } from '@/components/animated-button';
import { Gift } from '@/components/icons';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export function TicketAsGift() {
  const Taccount = useTranslations('account');
  return (
    <div
      className='w-full h-[440px]  bg-center bg-cover flex justify-center items-center px-4 md:px-0  overflow-hidden'
      style={{
        backgroundImage: `url(/new-images/ticket-as-gift.png)`,
      }}
    >
      <div className='md:w-10/12 h-4/5  flex flex-col justify-around xl:justify-center items-start md:items-center'>
        <div className='w-full flex justify-between items-start gap-4'>
          <h1 className='uppercase text-[24px] xs:text-[32px] font-bold text-background -tracking-[0.03em]'>
            <span className='text-[#F203BE]'>
              {Taccount('be_the_lucky_charm')}
            </span>
            {Taccount('for_your_special_one')}
          </h1>
          <Gift className='w-[80px] h-[80px] xs:w-[90px] xs:h-[90px] shrink-0' />
        </div>
        <p className='text-[#C5C5C5]  font-medium  text-[16px] md:text-[24px] -tracking-[0.03em]  xl:mb-[79px] xl:mt-[40px] '>
          {Taccount('present_this_ticket_as_a_gift')}
        </p>
        <Link
          target='_blank'
          rel='noreferrer'
          href={'/competitions'}
          className='w-full flex justify-start md:justify-center'
        >
          <SwipeAnimatedButton
            textStyle='text-[14px] -tracking-normal'
            iconStyle='h-[20px] w-[20px]'
            text={Taccount('purchase_and_send_now')}
            className='bg-[#F203BE]  hover:bg-[#F203BE]  w-full xs:w-[236px] '
          />
        </Link>
      </div>
    </div>
  );
}
