import { Winuwatch } from '@/components/icons';
import Image from 'next/image';
import { WinnerInfo } from './winner-info';
import { useTranslations } from 'next-intl';
import type { RouterOutputs } from '@/trpc/shared';

export const WinnersList = async ({
  winners,
}: Readonly<{
  winners: Promise<RouterOutputs['winners']['winnerGrouped']>;
}>) => (
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 '>
    {(await winners).map((winner) => (
      <Winner {...winner} key={Math.random()} />
    ))}
  </div>
);

// w-full max-w-[424px] md:max-w-none  mx-auto
function Winner(props: RouterOutputs['winners']['winnerGrouped'][number]) {
  const Twinners = useTranslations('winners');
  if ('id' in props) {
    const { img, name, watch } = props;
    return (
      <div className='h-[650px]   bg-foreground'>
        <div className='w-full  h-5/6 relative'>
          <Image
            src={img ?? ''}
            alt={name ?? 'winner'}
            width={0}
            height={0}
            sizes='100vw'
            className='object-cover  h-full w-full'
            unoptimized
          />
          <div className='absolute inset-0 bg-black/40'></div>
          <Winuwatch className='absolute top-4 left-3 h-4 fill-background' />
        </div>
        <div className='h-1/6 px-2  py-4 flex flex-col justify-between items-center '>
          <div className='w-full flex justify-between items-center'>
            <h1 className='text-background font-bold text-[20px] -tracking-[0.03em]'>
              {watch}
            </h1>
            <p className='font-medium text-[12px] text-[#898989] underline underline-offset-8 -tracking-normal'>
              {Twinners('draw_certificate')}
            </p>
          </div>
          <WinnerInfo {...props} />
        </div>
      </div>
    );
  }
  return null;
}
