export const dynamic = 'force-static';

import { AskedQuestions } from '@/components/asked-questions';
import { TopBnner } from './top-banner';
import { LayoutWrapper } from '@/components/layout-wrapper';

import { unstable_setRequestLocale } from 'next-intl/server';

export default function Faq({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <div>
      <TopBnner />
      <LayoutWrapper className='my-16 flex justify-center'>
        <div className='md:w-4/5 px-4 md:px-0 '>
          <AskedQuestions />
        </div>
      </LayoutWrapper>
    </div>
  );
}
