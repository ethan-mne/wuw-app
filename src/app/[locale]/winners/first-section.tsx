import { getTranslations } from 'next-intl/server';
import { formatCurrency } from '@/lib/formaters';
export async function FirstSection({
  amount_promise,
}: Readonly<{
  amount_promise: Promise<number>;
}>) {
  const [Twinners, amount] = await Promise.all([
    getTranslations('winners'),
    amount_promise,
  ]);
  return (
    <>
      <div
        className='w-full h-[605px] bg-cover bg-center relative'
        style={{
          backgroundImage: `url(/new-images/winners-bg.png)`,
        }}
      >
        <div className='absolute inset-0 bg-gradient-to-b from-foreground/70 to-foreground z-10'></div>
        <div className='z-20 w-full h-full flex flex-col gap-[110px] justify-center items-center relative'>
          <div className='flex flex-col justify-center items-center text-center gap-[51px]'>
            <h1 className='uppercase border border-background text-background rounded-full px-6 py-1 text-[31px] tracking-tighter'>
              winuwatch
            </h1>
            <div className='flex flex-col justify-center items-center gap-[20px] md:gap-[51px]'>
              <p className='text-[36px] md:[60px] lg:text-[64px] text-background font-bold uppercase -tracking-[0.05em]'>
                {Twinners('our_goal')}{' '}
                <span className='text-secondary'>
                  {Twinners('everyone_to_win')}
                </span>
              </p>
              <p className='uppercase text-[#A9A9A9] text-[22px] md:text-[40px] font-normal'>
                {Twinners('the_watch_of_their_dreams')}
              </p>
            </div>
          </div>
          <div className='flex flex-col lg:flex-row justify-center items-center lg:gap-2  text-center text-background '>
            <p className='text-[18px] md:text-[40px] font-medium md:font-bold -tracking-[0.03em] capitalize'>
              {Twinners('weve_given_away')}{' '}
            </p>
            <span className='text-secondary text-[32px] md:text-[40px] font-bold  -tracking-[0.03em] capitalize'>
              {formatCurrency(amount)}
            </span>
            <p className='text-[18px] md:text-[40px] font-medium md:font-bold -tracking-[0.03em] capitalize'>
              {Twinners('worth_of_watches')}
            </p>
          </div>
        </div>
      </div>
      <p className='text-foreground text-[18px] md:text-[40px] font-bold text-center capitalize my-[47px] md:my-[144px] -tracking-[0.02em]'>
        {Twinners('only_those_who_play_end_up_winning')}
      </p>
    </>
  );
}
