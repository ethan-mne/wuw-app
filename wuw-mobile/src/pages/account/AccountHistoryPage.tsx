import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { SafeImage } from '../../components/SafeImage';
import { Card, PageHeader } from '../../components/ui';
import { AccountNav } from '../../features/account/AccountNav';
import { formatGbp } from '../../lib/formatCurrency';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { resolveMediaUrl } from '../../lib/resolveMediaUrl';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { OrderSummary } from '../../types';

export function AccountHistoryPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void mobileDataService
      .listOrderHistory()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

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
          const imageSrc = resolveMediaUrl(order.competitionImageUrl ?? undefined);

          return (
            <Card key={order.id}>
              <div className="account-history-card-heading">
                <p className="status-label">Order #{order.id.slice(0, 8)}</p>
                {order.orderedAt ? (
                  <p className="account-history-order-date">
                    Ordered {formatDrawDateDdMmYyyy(order.orderedAt)}
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
            </Card>
          );
        })
      )}
    </section>
  );
}
