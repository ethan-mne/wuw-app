import { Card, PageHeader } from '../../components/ui';
import { legalPages } from '../../data/content';

interface LegalPageProps {
  pageKey: (typeof legalPages)[number]['path'];
}

export function LegalPage({ pageKey }: LegalPageProps) {
  const page = legalPages.find((item) => item.path === pageKey);

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Legal"
        title={page?.title ?? 'Legal page'}
        description="Skeleton legal screen with the same route naming as the source web app."
      />
      <Card>
        <p>
          Legal content is intentionally placeholder-only in the mobile V1. The route is
          present so navigation can stay aligned with the web product.
        </p>
      </Card>
    </section>
  );
}
