import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { articles } from '../../data/content';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';

export function FeedArticlePage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const article = articles.find((item) => item.slug === params.slug);

  if (!article) {
    return (
      <Card>
        <h2>Article not found</h2>
        <ActionLink to={withLocale(locale, 'feed')}>Back to feed</ActionLink>
      </Card>
    );
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow={article.category} title={article.title} description={article.excerpt} />
      <Card>
        <p>
          This is a mobile placeholder for the source MDX article route. The final app can
          receive article content from the mobile backend.
        </p>
        <p>
          {article.publishedAt} · {article.readTime}
        </p>
      </Card>
    </section>
  );
}
