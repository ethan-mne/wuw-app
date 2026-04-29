import { useTranslations } from 'next-intl';

export function FirstSection() {
  const ThowToPlay = useTranslations('howToPlay');
  return (
    <div
      className='w-full h-[605px] bg-cover bg-center relative'
      style={{
        backgroundImage: `url(/new-images/how-to-play.png)`,
      }}
    >
      <div className='absolute inset-0 bg-gradient-to-b from-foreground/70 to-foreground z-10'></div>
      <div className='z-20 w-full h-full flex flex-col gap-20 justify-center items-center relative'>
        <div className='flex flex-col justify-center items-center text-center'>
          <p className='uppercase text-secondary text-[16px] md:text-[26px]  font-medium'>
            {ThowToPlay('how_to_enter')}
          </p>
          <p className='uppercase text-[36px] md:text-[64px] font-bold text-background tracking-tighter'>
            {ThowToPlay('lux_competitions_simple')}
          </p>
          <p className='text-[20px] md:text-[26px] font-bold text-background'>
            {ThowToPlay('get_chance_to_win')}
          </p>
        </div>
      </div>
    </div>
  );
}
