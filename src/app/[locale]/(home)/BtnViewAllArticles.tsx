import { ScaleAnimatedLink } from '@/components/animated-button';
import { useTranslations } from 'next-intl';

const BtnViewAllArticles = () => {
  const feed = useTranslations('feed');
  return (
    <ScaleAnimatedLink
      href='/feed'
      text={feed('view_all_articles')}
      containerStyle='self-center mt-[77px] '
    />
  );
};

export default BtnViewAllArticles;
