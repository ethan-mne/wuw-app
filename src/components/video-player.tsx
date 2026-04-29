'use client';

import ReactPlayer, { type ReactPlayerProps } from 'react-player';

export function VideoPlayer({ url, ...props }: ReactPlayerProps) {
  return (
    <div className='w-full h-full relative'>
      <div className='absolute inset-x-0  bg-gradient-to-b from-black/50  to-black z-20  w-full h-full' />
      <h1 className='absolute inset-x-0 bottom-0 text-white text-[40px] md:text-[61px] uppercase z-20 text-center -tracking-[0.07em] leading-[97.2px] truncate'>
        WINUWATCH
      </h1>
      <ReactPlayer
        url={url}
        className='z-10'
        playing
        width='100%'
        height='100%'
        muted={true}
        controls={false}
        config={{
          youtube: {
            playerVars: { showinfo: 0, autoplay: 1, controls: 0 },
          },
          file: {
            forceVideo: true,
          },
        }}
        {...props}
      />
    </div>
  );
}

export function WinnersVideoPlayer({ src }: { src: string }) {
  return (
    <div className='w-full h-full relative'>
      <div className='absolute inset-x-0  bg-gradient-to-b from-black/50  to-black z-20  w-full h-full' />
      <h1 className='absolute inset-x-0 bottom-0 text-white text-[40px] md:text-[61px] uppercase z-20 text-center -tracking-[0.07em] leading-[97.2px] truncate'>
        WINUWATCH
      </h1>
      <video
        autoPlay
        muted
        loop
        playsInline
        className='z-10 w-full h-full object-cover object-center'
      >
        <source src={src} type='video/mp4' />
      </video>
    </div>
  );
}
