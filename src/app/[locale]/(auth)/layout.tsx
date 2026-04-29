import { LogoFooter } from '@/components/icons';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { type ReactNode } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';

interface AuthLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default function AuthLayout({
  children,
  params: { locale },
}: AuthLayoutProps) {
  unstable_setRequestLocale(locale);
  return (
    <div
      className='w-full h-[715px] flex items-center justify-center bg-center bg-cover relative px-2 md:px-0 overflow-hidden'
      style={{
        backgroundImage: `url(/new-images/watch-bg.png)`,
      }}
    >
      <div className='absolute inset-0  bg-gradient-to-b from-white via-white/70 to-white '></div>
      <LayoutWrapper className='z-20 h-full'>
        <div className='w-full h-full flex flex-row justify-center items-center '>
          <div className='hidden lg:flex flex-1  flex-col items-center'>
            <div className='w-[597px]'>
              <LogoFooter className='w-full h-[114.64px] object-cover object-center ' />
              <div className='flex w-full justify-between text-center font-extralight md:text-xl lg:text-2xl '>
                {'# LUXURY WATCH CONTEST'.split('').map((char, index) => (
                  <span key={index}>{char}</span>
                ))}
              </div>
            </div>
          </div>
          <div className='flex flex-1 justify-center items-center'>
            <div className='w-full xs:w-[409px] h-auto xs:h-[568px] flex flex-col bg-background shadow'>
              {/* <div className='w-full h-[54px] bg-foreground flex justify-center items-center'>
                <p className='text-background font-bold text-[16px]  -tracking-[0.05em]'>
                  Welcome to Luxury Watch Contest
                </p>
              </div> */}
              <div className='flex-grow p-2 '>{children}</div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </div>
  );
}
