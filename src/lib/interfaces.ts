import type {
  // Competition,
  // CompetitionStatus,
  // PrismaClient,
  Watches,
  ImagesUrl,
  order_paymentMethod,
} from '@prisma/client';

export interface CompetitionInterface {
  id: string;
  total_tickets: number;
  max_winners: number;
  name: string;
  end_date: Date;
  price: number;
  ticket_price: number;
  remaining_tickets: number;
  status: string;
  comp_image_url?: string | null;
  Watches: (Watches & { images_url: Array<Pick<ImagesUrl, 'url'>> }) | null;
  cash_alternative: number | null;
  _count?: {
    Ticket: number;
  };
  error?: unknown;
}

export interface CompetitionResponse {
  data: CompetitionInterface[];
  error?: unknown;
}

export interface TicketDetailsType {
  competitionImage: string;
  competitionName: string;
  competitionDate: Date;
  orderId: string;
  orderDetails: OrderDetailsType;
}

export interface OrderDetailsType {
  quantity: number;
  ticketValue: number;
  ticketsIds: string[];
}

export interface ConfirmationEmailProps {
  userName: string;
  message?: string;
  code: string | null;
  ticketDetails: TicketDetailsType;
  paymentMethod?: order_paymentMethod;
}
