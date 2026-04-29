import { LayoutWrapper } from '@/components/layout-wrapper';
import { AccountNav } from './account-nav';
import { useTranslations } from 'next-intl';

export function AccountHeader({ name }: { name: string | null }) {
  const Taccount = useTranslations('account');
  return (
    <div className='h-[74px] flex flex-col justify-center fixed top-[110px] w-full z-40 bg-foreground '>
      <div className='bg-[#2E2E2E] flex items-center md:hidden px-4 py-2 '>
        <h1 className='text-[15px]  md:text-[26px]  font-bold text-white -tracking-[0.03em]'>
          {Taccount('hello')} {name},
        </h1>
      </div>
      <div className='bg-[#1D1B1C] px-4 py-2 md:p-0  '>
        <LayoutWrapper className='w-full flex md:justify-center'>
          <div className='w-5/6 flex justify-between items-center'>
            <h1 className='hidden text-[26px] font-bold text-white md:inline-block'>
              {Taccount('hello')} {name},
            </h1>
            <AccountNav />
          </div>
        </LayoutWrapper>
      </div>
    </div>
  );
}
