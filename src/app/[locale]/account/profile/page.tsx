import { InformationForm, TextProfile } from './information-form';
import { api } from '@/trpc/server';

export const dynamic = 'force-dynamic';

export default async function Profile() {
  const profile = await api.Users.CurrentUser.query();
  return (
    <div className='flex flex-col gap-[47px] md:gap-[40px] px-4 md:p-0 '>
      <h1 className='text-foreground text-[20px] md:text-[24px] font-bold uppercase  -tracking-[0.05em] '>
        <TextProfile />
      </h1>
      <div className='grid grid-cols-3 gap-2  '>
        <div className='col-span-3 md:col-span-2'>
          <InformationForm profile={profile} />
        </div>
      </div>
    </div>
  );
}
