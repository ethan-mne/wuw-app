'use client';

import { Cup, Line, Hand, Bag, Play } from '@/components/icons';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function Stepper() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const Thome = useTranslations('home');

  if (isDesktop) {
    return (
      <div className='flex flex-col items-center justify-center gap-y-12'>
        <ul className='flex w-4/5 flex-none flex-row '>
          <li className='flex items-center '>
            <span className='flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#1D1B1C] shadow'>
              <Cup className='h-[30px] w-[30px] fill-white' />
            </span>
            <Line className=' h-full w-full' />
          </li>
          <li className='flex items-center'>
            <span className='flex h-[100px] w-[100px] shrink-0 items-center justify-center  rounded-full border-2 border-[#1D1B1C] bg-white '>
              <Play className='h-[30px] w-[30px]' />
            </span>
            <Line className=' h-full w-full' />
          </li>
          <li className='flex items-center'>
            <span className='flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-full border-2 border-[#1D1B1C] bg-[#EDEDE4]  '>
              <Bag className='h-[30px] w-[30px]' />
            </span>
            <Line className='h-full w-full' />
          </li>
          <li className='flex items-center'>
            <span className='flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-full border-2 border-white  bg-[#114F33] shadow'>
              <Hand className='h-[30px] w-[30px]' />
            </span>
          </li>
        </ul>
        <div className='flex w-full border-b border-t border-foreground py-0.5'>
          <div className='flex w-full items-center   border-y-2 border-foreground py-2  text-[32px] font-bold -tracking-[0.06em]'>
            <p className='flex-1 text-center   uppercase  text-black'>
              {Thome('choose')}
            </p>
            <p className='flex-1 text-center  uppercase text-black'>
              {Thome('play')}
            </p>
            <p className='flex-1 text-center  uppercase text-black'>
              {Thome('buy')}
            </p>
            <p className='flex-1 text-center  uppercase text-black'>
              {Thome('win')}
            </p>
          </div>
        </div>
        <div className='flex w-full  gap-x-[50px] xl:gap-x-[139px] px-6 text-start text-[16px] font-medium -tracking-normal leading-[24px] text-[#898989]'>
          <p className='flex-1 '>{Thome('choose_how_many_tickets')}</p>
          <p className='flex-1 '>{Thome('test_your_watch_expertise')}</p>
          <p className='flex-1'>{Thome('pay_safely_to_enter')}</p>
          <p className='flex-1'>{Thome('thats_all_there_is_to_it')}</p>
        </div>
      </div>
    );
  }
  return (
    <div className='relative flex w-full flex-col items-center  overflow-hidden '>
      <div className='relative pt-6'>
        <div className='absolute flex h-full w-full flex-col items-center justify-between   '>
          <section className='relative w-full '>
            <div className='absolute -top-6 flex w-full -translate-x-4 flex-col items-center gap-8 xs:-translate-x-8'>
              <span className='flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#1D1B1C] shadow'>
                <Cup className='h-[30px] w-[30px] fill-white' />
              </span>
              <div className='flex flex-col px-10 '>
                <p className='text-[32px] font-bold uppercase text-foreground -tracking-[0.06em]'>
                  {Thome('choose')}
                </p>
                <p className='text-start text-[16px] font-medium text-[#898989] -tracking-normal leading-[24px]'>
                  {Thome('choose_how_many_tickets')}
                </p>
              </div>
            </div>
          </section>

          <section className='relative w-full'>
            <div className='absolute flex w-full translate-x-5 flex-col items-start gap-8 px-8 xs:translate-x-8'>
              <span className='flex h-[81px] w-[81px] shrink-0 items-center justify-center  rounded-full border-2 border-[#1D1B1C] bg-white '>
                <Play className='h-[30px] w-[30px]' />
              </span>
              <div className='flex flex-col '>
                <p className='text-[32px] font-bold uppercase text-foreground -tracking-[0.06em] '>
                  {Thome('play')}
                </p>
                <p className='text-start text-[16px] font-medium text-[#898989] -tracking-normal leading-[24px]'>
                  {Thome('test_your_watch_expertise')}
                </p>
              </div>
            </div>
          </section>

          <section className='relative w-full'>
            <div className='absolute flex w-full -translate-x-5 flex-col items-start gap-8 px-8 xs:-translate-x-8'>
              <span className='flex h-[81px] w-[81px]  shrink-0 items-center justify-center rounded-full border-2 border-[#1D1B1C] bg-[#EDEDE4]  '>
                <Bag className='h-[30px] w-[30px]' />
              </span>
              <div className='flex flex-col '>
                <p className='text-[32px] font-bold uppercase text-foreground -tracking-[0.06em]'>
                  {Thome('buy')}
                </p>
                <p className='text-start text-[16px] font-medium text-[#898989] -tracking-normal leading-[24px]'>
                  {Thome('pay_safely_to_enter')}
                </p>
              </div>
            </div>
          </section>

          <section className='relative w-full'>
            <div className='absolute -top-12 flex w-full flex-col items-center gap-8'>
              <span className='flex h-[100px] w-[100px]  shrink-0 items-center justify-center rounded-full border-2 border-white  bg-[#114F33] shadow'>
                <Hand className='h-[30px] w-[30px]' />
              </span>
              <div className='flex flex-col px-2'>
                <p className='text-[32px] font-bold uppercase text-foreground -tracking-[0.06em] '>
                  {Thome('win')} {Thome('your_watch')}
                </p>
                <p className='text-start text-[16px] font-medium text-[#898989] -tracking-normal leading-[24px]'>
                  {Thome('thats_all_there_is_to_it')}
                </p>
              </div>
            </div>
          </section>
        </div>
        <Image
          src='/new-images/stepper-line.png'
          alt='stepper line'
          width={280}
          height={100}
          sizes='100vw'
        />
      </div>
      <div className='h-56 w-full' />
    </div>
  );
}
