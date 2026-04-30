import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { articles } from '../../data/content';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';

export function FeedPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Feed"
        title="Articles"
        description="Mobile adaptation of the web feed index."
      />
      {articles.map((article) => (
        <Card key={article.slug}>
          <p className="status-label">{article.category}</p>
          <h3>{article.title}</h3>
          <p>{article.excerpt}</p>
          <ActionLink variant="secondary" to={withLocale(locale, `feed/${article.slug}`)}>
            Read article
          </ActionLink>
        </Card>
      ))}
    </section>
  );
}
