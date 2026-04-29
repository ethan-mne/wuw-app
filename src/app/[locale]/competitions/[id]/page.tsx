import { LayoutWrapper } from '@/components/layout-wrapper';
import { CheckoutForm } from './checkout-form';
import { api } from '@/trpc/server';
import { redirect } from 'next/navigation';
import { HeaderTimer } from './header-timer';
import { cookies } from 'next/headers';

export default async function Competition({
  params,
}: Readonly<{
  params: { id: string };
  searchParams: {
    error?: string;
  };
}>) {
  // get the error from the search params
  const UtmCookie = cookies().get('utm');
  const data = await api.NewCompetition.getCompetition.query(params.id);
  if (!data) {
    redirect('/competitions');
  }
  const { competition, session } = data;
  //Redirect to competitions page if tickets soldout or competition is closed or ended
  if (
    competition.remaining_tickets === 0 ||
    competition.status === 'COMPLETED' ||
    (competition.end_date && new Date() > competition.end_date)
  ) {
    redirect('/competitions');
  }
  let profile = null;
  let user_voucher = null;

  if (session) {
    profile = await api.Users.CurrentUser.query();
    user_voucher = await api.Referal.getCoupon.query();
    // Adding user_voucher to the profile object, if profile is not null
    if (profile) {
      profile.refferalCode = user_voucher;
    }
  }
  return (
    <div className=' relative'>
      <HeaderTimer end_date={competition.end_date} />
      <LayoutWrapper className='mt-10'>
        <CheckoutForm
          competition={competition}
          profile={profile}
          utm={UtmCookie?.value}
        />
      </LayoutWrapper>
    </div>
  );
}
