import { SwipeAnimatedButton } from '@/components/animated-button';
import { Trustpilot } from '@/components/icons';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
export function FeedBack() {
  const Tcompetition = useTranslations('competition');
  return (
    <div className='w-full h-[440px] bg-[#2F2F2F]  flex justify-center items-center px-4 md:px-0'>
      <div className='md:w-3/5 h-4/5 flex flex-col  items-start md:items-center justify-center '>
        <p className='text-center text-[20px] font-bold text-background hidden  md:block -tracking-normal'>
          {Tcompetition('share_experience_on')}
        </p>

        <p className='text-start text-[32px] font-bold text-background md:hidden'>
          {Tcompetition('trustpilot_comment')}
        </p>

        <Trustpilot className=' h-16 mt-[49px] mb-[61px]' />

        <p className='text-center text-[16px] font-bold text-background mb-[46px]'>
          {Tcompetition('hungry_for_feedbacks')}
        </p>

        <Link
          href={'https://fr.trustpilot.com/review/winuwatch.uk'}
          className='w-full flex justify-start md:justify-center'
        >
          <SwipeAnimatedButton
            textStyle='text-[14px] -tracking-normal'
            iconStyle='h-[20px] w-[20px]'
            text={Tcompetition('give_feedback_now')}
            className='bg-[#00B67A]  hover:bg-[#00B67A]  w-full xs:w-[236px] '
          />
        </Link>
      </div>
    </div>
  );
}
