import { redirect } from 'next/navigation';
import { TestPageClient } from './test-page-client';

const orderID = '49606bfd-eea0-40fc-93c8-c02cb31fc5cf';
const competitionID = 'cm0nkw06o0003exdvjpqh9w03';

export default async function TestPage() {
  if (process.env.VERCEL_ENV === 'production') {
    redirect('/404');
  }

  return <TestPageClient orderId={orderID} competitionId={competitionID} />;
}
