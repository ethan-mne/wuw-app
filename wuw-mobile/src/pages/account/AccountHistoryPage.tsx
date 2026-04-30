import { useEffect, useState } from 'react';
import { Card, PageHeader } from '../../components/ui';
import { AccountNav } from '../../features/account/AccountNav';
import { mobileDataService } from '../../services/mobileDataService';
import type { OrderSummary } from '../../types';

export function AccountHistoryPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    void mobileDataService.listOrderHistory().then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Account" title="History" />
      <AccountNav />
      {orders.map((order) => (
        <Card key={order.id}>
          <p className="status-label">Ticket history</p>
          <h3>Order #{order.id}</h3>
          <p>
            Competition: {order.competitionId} | Tickets: {order.ticketQuantity}
          </p>
        </Card>
      ))}
    </section>
  );
}
