import { LayoutWrapper } from '@/components/layout-wrapper';
import { useTranslations } from 'next-intl';
import { SignOut } from '@/components/signout';

export function SubHeader({ coins }: { coins: number }) {
  const Taccount = useTranslations('account');
  return (
    <div className='flex w-full mt-[184px] mb-[49px] md:mb-[64px] '>
      <LayoutWrapper className='w-full flex justify-center'>
        <div className='w-full md:w-5/6 flex justify-between items-center text-[13px] xs:text-[14px] md:text-[16px] px-4 md:px-0'>
          <p className='text-foreground font-bold -tracking-[0.03em]  '>
            {Taccount('credits')} :{' '}
            <span className='uppercase'>{coins} WINCOINS</span>
          </p>
          <SignOut />
        </div>
      </LayoutWrapper>
    </div>
  );
}
