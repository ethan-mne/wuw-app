import type { ReferralHistoryType } from '@/lib/types';
import { useTranslations } from 'next-intl';

export async function ReferralsList({
  referralHistory,
}: {
  referralHistory: ReferralHistoryType;
}) {
  return referralHistory.length > 0 ? (
    <div className='flex flex-col gap-[24px] md:gap-[22px] px-1 md:p-0'>
      {referralHistory.map((item, i) => {
        return (
          <ReferralItem referralHistoryItem={referralHistory[i]} key={i} />
        );
      })}
    </div>
  ) : (
    <div className='w-full min-h-[123px] md:h-[148px] flex justify-center items-center  bg-background shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px] px-[24px] md:px-[45px] '>
      <p className='text-[#898989] text-[16px] font-bold -tracking-[0.05em]'>
        No referrals yet
      </p>
    </div>
  );
}

export function ReferralItem({
  referralHistoryItem,
}: {
  referralHistoryItem: ReferralHistoryType[0] | undefined;
}) {
  const Thistory = useTranslations('history');
  const Thome = useTranslations('home');
  return (
    <div className='w-full min-h-[123px] md:h-[148px] flex justify-between items-center  bg-background shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px] px-[24px] md:px-[45px] '>
      <div className='h-full md:h-auto flex flex-col md:flex-row items-start  gap-3 md:gap-8'>
        <p className='hidden md:flex text-[18px] font-bold text-foreground -tracking-[0.03em]'>
          {referralHistoryItem?.fullname.toUpperCase()}
        </p>
        <p className='text-[#898989] text-[16px] font-bold -tracking-[0.05em]'>
          {referralHistoryItem?.comp_name.toUpperCase()}
        </p>
        <div className='flex flex-col md:flex-row md:gap-8 items-center'>
          <p className='flex text-[18px] font-bold text-foreground md:hidden -tracking-[0.03em]'>
            {referralHistoryItem?.fullname.toUpperCase()}
          </p>
          <p className='text-[#898989] text-[16px] font-medium -tracking-[0.05em]'>
            {referralHistoryItem?.createdAt.toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className='flex flex-col'>
        <p className='text-[#898989] text-[16px] font-bold -tracking-[0.05em]'>
          {Thistory('gain')}
        </p>
        <p className='text-foreground font-bold text-[18px] -tracking-[0.03em]'>
          10 Wincoins
        </p>
      </div>
    </div>
  );
}
