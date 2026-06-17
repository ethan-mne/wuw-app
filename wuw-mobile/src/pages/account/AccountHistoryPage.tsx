import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { SafeImage } from '../../components/SafeImage';
import { Card, PageHeader } from '../../components/ui';
import { AccountNav } from '../../features/account/AccountNav';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { formatGbp } from '../../lib/formatCurrency';
import { formatDateTimeDdMmYyyyHhMm } from '../../lib/formatDrawDate';
import { cacheKeys } from '../../lib/dataCache';
import { resolveMediaUrl } from '../../lib/resolveMediaUrl';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';

export function AccountHistoryPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const { data: orders = [], isLoading: loading } = useCachedQuery(
    cacheKeys.orderHistory,
    () => mobileDataService.listOrderHistory(),
  );
  const [fallbackImageByCompetitionId, setFallbackImageByCompetitionId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const missingCompetitionIds = Array.from(
      new Set(
        orders
          .map((order) => order.competitionId.trim())
          .filter((competitionId) => competitionId.length > 0)
          .filter((competitionId) => {
            const order = orders.find((item) => item.competitionId.trim() === competitionId);
            if (!order) {
              return false;
            }
            const hasOrderImage = resolveMediaUrl(order.competitionImageUrl ?? undefined).trim().length > 0;
            const hasFallbackImage = Boolean(fallbackImageByCompetitionId[competitionId]);
            return !hasOrderImage && !hasFallbackImage;
          }),
      ),
    );

    if (missingCompetitionIds.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      missingCompetitionIds.map(async (competitionId) => {
        const competition = await mobileDataService.getCompetition(competitionId).catch(() => undefined);
        const imageUrl = resolveMediaUrl(
          competition?.competitionImageUrl
          ?? competition?.watch.images[0]?.url
          ?? undefined,
        ).trim();
        return { competitionId, imageUrl };
      }),
    ).then((rows) => {
      if (cancelled) {
        return;
      }

      setFallbackImageByCompetitionId((previous) => {
        let didChange = false;
        const next = { ...previous };
        for (const row of rows) {
          if (row.imageUrl) {
            if (next[row.competitionId] !== row.imageUrl) {
              next[row.competitionId] = row.imageUrl;
              didChange = true;
            }
          }
        }
        return didChange ? next : previous;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [orders, fallbackImageByCompetitionId]);

  return (
    <section className="page-stack page-content-pad">
      <PageHeader eyebrow="Account" title="History" />
      <AccountNav />
      {loading ? (
        <div className="home-competitions-loading" role="status" aria-live="polite">
          <span className="home-competitions-loading-spinner" aria-hidden />
          <span className="sr-only">Loading history…</span>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <p className="status-label">No tickets yet</p>
          <p>Confirmed orders will show up here with competition details.</p>
          <Link className="action-link primary" to={withLocale(locale, '')}>
            Back to home
          </Link>
        </Card>
      ) : (
        orders.map((order) => {
          const title =
            order.competitionName?.trim() || `Competition ${order.competitionId.slice(0, 8)}…`;
          const imageSrc = resolveMediaUrl(
            order.competitionImageUrl
            ?? fallbackImageByCompetitionId[order.competitionId]
            ?? undefined,
          );

          return (
            <section key={order.id} className="card account-history-card">
              <div className="account-history-card-heading">
                <p className="status-label">Order #{order.id.slice(0, 8)}</p>
                {order.orderedAt ? (
                  <p className="account-history-order-date">
                    Ordered {formatDateTimeDdMmYyyyHhMm(order.orderedAt)}
                  </p>
                ) : null}
              </div>
              {imageSrc ? (
                <div className="account-history-card-media">
                  <SafeImage alt={title} src={imageSrc} />
                </div>
              ) : null}
              <h3>{title}</h3>
              <div className="account-history-meta">
                {order.ticketQuantity} ticket{order.ticketQuantity === 1 ? '' : 's'}
                {order.ticketPrice > 0
                  ? ` · ${formatGbp(Number(order.ticketPrice))} each`
                  : null}
                {order.couponCode ? ` · Code ${order.couponCode}` : null}
              </div>
            </section>
          );
        })
      )}
    </section>
  );
}
