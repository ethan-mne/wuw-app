import React, { type ReactNode } from 'react';
import { LayoutWrapper } from './layout-wrapper';

export function TopSection({
  bgImage,
  children,
}: {
  bgImage: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        className='w-full flex items-center justify-center bg-cover bg-center  relative pl-4 md:pl-0 overflow-hidden '
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'auto',
        }}
      >
        <div className='absolute inset-0  bg-gradient-to-b from-white via-white/90 to-white '></div>
        <LayoutWrapper className='relative flex lg:justify-center '>
          <div className='w-full md:w-5/6 '>{children}</div>
        </LayoutWrapper>
      </div>
    </div>
  );
}
