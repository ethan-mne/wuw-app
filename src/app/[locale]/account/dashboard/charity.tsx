import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function Charity() {
  const Tcharity = useTranslations('charity');
  const Thome = useTranslations('home');

  return (
    <div
      className='w-full h-[440px] flex  justify-center items-center bg-cover bg-center relative'
      style={{
        backgroundImage: `url(https://d9ylgh2z4lcdz.cloudfront.net/charity-children.png)`,
      }}
    >
      <div className=' group absolute inset-0 z-10 bg-black bg-opacity-50 bg-gradient-to-tr from-black to-dark'></div>
      <div className='z-20  h-5/6 w-4/5 flex flex-col gap-3 xs:gap-6 items-center relative'>
        <div className='w-full'>
          <div className='border-t border-white w-fit pt-0.5'>
            <h1 className='uppercase text-[24.25px] text-white tracking-tight border-t-2 border-white'>
              WINUWATCH
            </h1>
          </div>
          <p className='font-bold  text-[14px] xs:text-[18px] md:text-[20px] text-background'>
            &ldquo; {Tcharity('not_just_about')} &ldquo;
          </p>
        </div>
        <div className=''>
          <p className='text-secondary text-[18px]  md:text-[24px]  xs:text-[20px] font-bold uppercase'>
            {Tcharity('for_each_ticket')}{' '}
          </p>
          <p className='text-background text-[18px] md:text-[24px]  xs:text-[20px] font-bold uppercase '>
            {Thome('to_help_seriously_ill_children')}
          </p>
        </div>
        <Image
          src='/new-images/super-heros.png'
          alt='super heros logo'
          height={130}
          width={130}
          className='absolute -bottom-[60px] right-0 hidden md:block'
        />
      </div>
    </div>
  );
}
