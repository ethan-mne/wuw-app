import Image from 'next/image';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { SectionTitle } from '@/components/section-title';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function Certificate({ className }: { className?: string }) {
  const Thome = useTranslations('home');

  return (
    <div className={cn('mt-[104px] flex flex-col  md:gap-[48px]', className)}>
      <LayoutWrapper className='flex flex-col'>
        <div className='w-full md:w-4/5 lg:self-center pl-4 md:pl-0'>
          <SectionTitle
            leftSideStyle='pr-0  lg:pr-10 xl:pr-30'
            subtitle={Thome('our_partner_randomdraws')}
          >
            <p className='text-foreground -tracking-[0.05em]'>
              {Thome('we_use')}{' '}
              <span className='text-primary'>{Thome('tpal_elec')}</span>
              <span className='hidden md:block'>
                {Thome('computerized_system')}
              </span>
            </p>
          </SectionTitle>
        </div>
      </LayoutWrapper>
      <div
        className='relative flex h-[848px] w-full items-center justify-center bg-white bg-cover bg-center '
        style={{
          // backgroundImage: `url(/new-images/certificate-bg.png)`,
          backgroundImage: `url(https://d9ylgh2z4lcdz.cloudfront.net/1725877516324.webp)`,
        }}
      >
        <div className='absolute inset-x-0 w-full h-full bg-gradient-to-b from-white via-white/85 to-white z-10 ' />
        <LayoutWrapper className='z-20'>
          <div className='flex h-full w-full flex-col items-center lg:flex-row gap-[20px] lg:gap-0  '>
            <div className='flex w-full flex-1 items-center  justify-center '>
              <div className='flex flex-col items-start  md:justify-center  gap-[39px] pl-4 md:pl-0  w-full md:w-[462px]'>
                <div className='w-full xs:w-[295px] md:w-[434px]  h-[52px] md:h-[76px] '>
                  <Image
                    src='/new-images/randomdraws-logo.png'
                    alt='randomdraws logo'
                    width={434}
                    height={76}
                    sizes='(min-width: 768px) 434px, 295px'
                    className='w-full h-full object-cover bg-center'
                  />
                </div>

                <p className='hidden text-[26px] -tracking-[0.05em] font-bold text-foreground lg:flex '>
                  {Thome('uses_latest_technology')}
                </p>
              </div>
            </div>
            <div className='flex h-full flex-1 items-start justify-center  overflow-hidden'>
              <div className='flex w-full md:w-[517px] h-[640px] flex-col items-center justify-center gap-[62px] bg-foreground  px-5 md:h-[699px]'>
                <h2 className='text-[30px] md:text-[52px] font-bold -tracking-[0.05em] text-white '>
                  {Thome('draw_certificate_example')}
                </h2>
                <div className='h-[428] w-full md:w-[349px]   rounded-[20px] '>
                  <Image
                    src='https://d9ylgh2z4lcdz.cloudfront.net/randomdraws-certificate.png'
                    width={349}
                    height={428}
                    sizes='(min-width: 768px) 349px, 90vw'
                    alt='randomdraws certificate'
                    className='bg-center bg-cover  w-full h-full rounded-[20px]  border-secondary border-2'
                  />
                </div>
              </div>
            </div>
          </div>
        </LayoutWrapper>
      </div>
    </div>
  );
}
