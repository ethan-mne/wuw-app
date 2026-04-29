'use client';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { CompetitionInterface } from '@/lib/interfaces';
import { formatPrice } from '@/lib/formaters';
import { formatDate } from 'date-fns';
import { useTranslations } from 'next-intl';
import static_competitions from '@/lib/static-upcoming-competitions';

interface CompetitionWatchesProps {
  competitions_type: 'PAST' | 'UPCOMING';
  data: CompetitionInterface[];
}
export function CompetitionWatches({
  competitions_type,
  data,
}: CompetitionWatchesProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const Twinners = useTranslations('winners');
  const Thome = useTranslations('home');
  const displaydata = competitions_type === 'PAST' ? data : static_competitions;
  if (isDesktop) {
    return (
      <div className='grid  grid-cols-2 gap-x-4 gap-y-[60px] xl:grid-cols-3'>
        {displaydata.slice(0, 6).map((comp) => (
          <div
            className='group relative flex w-full flex-col  bg-white h-[511px] md:h-[538px] '
            key={comp.Watches?.model}
          >
            {competitions_type === 'UPCOMING' && (
              <Link
                target='_blank'
                rel='noreferrer'
                href={'/competitions/' + comp.id}
                className='w-full items-center justify-center gap-3 text-[16px] font-bold -tracking-[0.03em] absolute inset-x-0  group-hover:border-b  bottom-[84px] h-0 z-30  flex overflow-hidden  bg-black  text-white  ease-[cubic-bezier(0.38, 0.01, 0.38, 1)] duration-100 group-hover:h-[58px] '
              >
                {Thome('get_early_accesss')}
                <ArrowRight className='w-6 h-6 text-secondary' />
              </Link>
            )}
            <div className='w-full h-[429px] md:h-[489px] overflow-hidden z-10'>
              <Image
                src={
                  comp.comp_image_url ??
                  comp.Watches?.images_url[0]?.url ??
                  '/default_past_image.jpg'
                  // competitions_type === 'PAST'
                  //   ? comp.comp_image_url ?? '/default_past_image.jpg'
                  //   : comp.Watches?.images_url[0]?.url ??
                  //     '/default_past_image.jpg'
                  // comp.Watches?.images_url[0]?.url
                }
                alt={comp.Watches?.model ?? 'Not available'}
                width={0}
                height={0}
                sizes='(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw'
                className='object-cover object-center w-full h-full group-hover:scale-125 duration-1000 '
              />
            </div>
            <div className='z-10 flex w-full flex-col items-center justify-center gap-1  text-primary group-hover:bg-primary  group-hover:text-white h-[88px]  md:h-[94px] overflow-hidden  '>
              <p className='text-[18px] font-bold -tracking-[0.03em] capitalize truncate'>
                {(comp.Watches?.brand ?? '') + ' ' + comp.Watches?.model}
              </p>
              {competitions_type === 'PAST' && (
                <p className='text-[13px] font-bold -tracking-[0.03em]'>
                  {Twinners('won')} {formatDate(comp.end_date, 'dd.MM.yyyy')}
                </p>
              )}
              <p className='text-[16px] font-normal -tracking-[0.03em]'>
                {Twinners('value')} {formatPrice(comp.price)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Carousel
      className='flex w-full max-w-full flex-col gap-6 '
      opts={{
        align: 'start',
      }}
    >
      <CarouselContent className='-ml-4 w-full'>
        {displaydata.map((comp) => (
          <CarouselItem
            key={comp.Watches?.id}
            className='max-w-[324px]  pl-4 md:basis-1/2 lg:basis-1/3'
          >
            <div
              className='flex w-full flex-col  overflow-hidden  bg-white'
              key={comp.Watches?.model}
            >
              <div
                className={cn('w-full h-[429px]', {
                  '': competitions_type === 'UPCOMING',
                  '': competitions_type === 'PAST',
                })}
              >
                <Image
                  src={
                    comp.comp_image_url ??
                    comp.Watches?.images_url[0]?.url ??
                    '/default_past_image.jpg'
                    // competitions_type === 'PAST'
                    //   ? comp.comp_image_url ?? '/default_past_image.jpg'
                    //   : comp.Watches?.images_url[0]?.url ??
                    //     '/default_past_image.jpg'
                    // comp.Watches?.images_url[0]?.url
                  }
                  alt={comp.Watches?.model ?? 'Not available'}
                  width={0}
                  height={0}
                  sizes='324px'
                  className='w-full h-full object-cover object-center'
                />
              </div>

              <div
                className={cn(
                  'z-20 w-full  flex items-center justify-center overflow-hidden ',
                  {
                    'bg-stone-200 text-center text-foreground h-[54px] ':
                      competitions_type === 'UPCOMING',
                    'border-t border-t-primary bg-white  h-[86px] ':
                      competitions_type === 'PAST',
                  },
                )}
              >
                {competitions_type === 'PAST' ? (
                  <div className='w-full h-full flex items-center  p-4  '>
                    <div className='flex  flex-col justify-between 	w-4/5 '>
                      <p className='text-[20px] font-bold -tracking-[0.03em] text-foreground   truncate '>
                        {comp.Watches?.brand ??
                          '' +
                            comp.Watches?.model +
                            ' ' +
                            comp.Watches?.reference_number}
                      </p>
                      <p className='text-[14px] font-bold -tracking-[0.03em]  text-zinc-500 truncate '>
                        {Twinners('won')}{' '}
                        {formatDate(comp.end_date, 'dd.MM.yyyy')}
                      </p>
                    </div>
                    <div className='flex  flex-col  justify-between 	w-1/5'>
                      <p className='text-[20px] font-bold -tracking-[0.03em] text-primary truncate'>
                        {formatPrice(comp.price)}
                      </p>
                      <p className='text-[14px] font-bold -tracking-[0.03em] text-zinc-500'>
                        {Twinners('value')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className='text-[18px] fon-bold truncate -tracking-[0.03em] text-foreground px-8'>
                    {comp.Watches?.brand ?? '' + comp.Watches?.model}
                  </p>
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* // carousel controls */}
      <div className='pr-3 md:pr-0 flex items-center justify-end gap-[10px] md:gap-0'>
        <CarouselPrevious className='w-[49px] h-[49px] md:w-[58px] md:h-[58px] border-none bg-zinc-800 hover:bg-zinc-800'>
          <ArrowLeft className='h-[27.08px] w-[27.08px] md:h-[32.05px] md:w-[32.05px] text-secondary ' />
        </CarouselPrevious>
        <CarouselNext className='w-[49px] h-[49px] md:w-[58px] md:h-[58px] border-none bg-zinc-800 hover:bg-zinc-800'>
          <ArrowRight className='h-[27.08px] w-[27.08px] md:h-[32.05px] md:w-[32.05px] text-secondary ' />
        </CarouselNext>
      </div>
    </Carousel>
  );
}
