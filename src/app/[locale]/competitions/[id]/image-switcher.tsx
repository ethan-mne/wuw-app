'use client';

import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

export function ImageSwitcher({
  watchImages,
}: {
  watchImages: {
    src: string;
  }[];
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [currentImage, setCurrentImage] = useState<string>(
    watchImages[0]?.src ?? '',
  );
  const displayedImages = !isDesktop
    ? watchImages.filter((img) => img.src != currentImage)
    : watchImages;
  return (
    <div className='flex flex-1 flex-col md:flex-row md:gap-1 h-full justify-evenly  '>
      <div className='w-full md:w-1/5 flex flex-row md:flex-col items-center justify-between  order-last md:order-first'>
        {displayedImages.map((img, i) => (
          <WatchImge
            {...img}
            key={i}
            className={cn({ 'flex-1 h-[130px] rounded-none ': !isDesktop })}
            imageClassName={cn({ 'rounded-none ': !isDesktop })}
            active={img.src === currentImage}
            onClick={() => {
              setCurrentImage(img.src);
            }}
          />
        ))}
      </div>
      <div className='w-full h-[390px] md:w-[514px] md:h-[561px]'>
        <Image
          src={currentImage}
          alt='plceholder'
          width={0}
          height={0}
          sizes='100vw'
          className='w-full h-full object-center object-cover'
        />
      </div>
    </div>
  );
}

const WatchImge = ({
  src,
  active,
  onClick,
  className,
  imageClassName,
}: Readonly<{
  src: string;
  active: boolean;
  onClick: () => void;
  className?: string;
  imageClassName?: string;
}>) => (
  <Button
    className={cn(
      'w-[88px] h-[96px]  p-0 shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px] border-none bg-background',
      {
        'border border-[#114F33] bg-opacity-50  rounded-lg': active,
      },
      className,
    )}
    onClick={onClick}
  >
    <Image
      src={src}
      alt='plceholder'
      width={0}
      height={0}
      sizes='100vw'
      className={cn(
        'w-full h-full object-cover',
        {
          'border border-[#114F33] bg-opacity-50 rounded-lg ': active,
        },
        imageClassName,
      )}
    />
  </Button>
);
