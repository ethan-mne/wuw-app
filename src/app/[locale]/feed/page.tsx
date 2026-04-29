import { TopSection } from '@/components/top-section';
import { Blog } from '../(home)/blog';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Suspense } from 'react';
import { readAllPostFiles } from '@/lib/read-posts';
import BecauseWeLove from '../(home)/becauseWeLove';

import { unstable_setRequestLocale } from 'next-intl/server';

export const revalidate = false;

export default async function Feed({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const posts = await readAllPostFiles();
  return (
    <div>
      <TopSection bgImage='/new-images/watch-bg.png'>
        <BecauseWeLove />
      </TopSection>
      <LayoutWrapper>
        <Suspense>
          <Blog className='mt-10' posts={posts} />
        </Suspense>
      </LayoutWrapper>
    </div>
  );
}
