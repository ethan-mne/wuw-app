import { Card, PageHeader } from '../../components/ui';
import { supportPages } from '../../data/content';

interface SupportPageProps {
  pageKey: (typeof supportPages)[number]['path'];
}

export function SupportPage({ pageKey }: SupportPageProps) {
  const page = supportPages.find((item) => item.path === pageKey);

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Support"
        title={page?.title ?? 'Support page'}
        description={page?.summary ?? 'Skeleton route kept from the source web app.'}
      />
      <Card>
        <p>
          This V1 screen preserves the web route and product naming. Detailed content
          will be connected from the mobile backend or CMS later.
        </p>
      </Card>
    </section>
  );
}
