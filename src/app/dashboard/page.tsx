import { redirect } from 'next/navigation';
import { Dashboard } from './components';
import { api } from '@/trpc/server';
import { env } from '@/env';

const isDashboardDevBypassEnabled = () =>
  env.NODE_ENV === 'development' && env.DASHBOARD_DEV_BYPASS === 'true';
const defaultRedirect = '/api/auth/signin' as const;
export default async function DashboardPage() {
  if (isDashboardDevBypassEnabled()) {
    return <Dashboard />;
  }

  try {
    const profile = await api.Users.CurrentUser.query();
    if (profile.is_admin) {
      return <Dashboard />;
    } else {
      redirect(defaultRedirect);
    }
  } catch (error) {
    redirect(defaultRedirect);
  }
  // if (!profile) {
  //   redirect('/');
  // }
}
