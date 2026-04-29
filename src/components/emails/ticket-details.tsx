import { Column, Hr, Img, Row, Section, Text } from '@react-email/components';
import { Qrcode } from './qrcode-section';

import { formatPrice } from '@/lib/formaters';
import { OrderDetailsType, TicketDetailsType } from '@/lib/interfaces';

export function TicketDetails({
  competitionImage,
  competitionName,
  orderDetails,
  orderId,
}: TicketDetailsType) {
  return (
    <Section>
      <Img
        src={competitionImage}
        alt='rolex-image'
        width='600'
        height='481'
        style={{
          width: '600px',
          height: '481px',
          maxWidth: '600px',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
      <Section
        style={{
          width: '510px',
        }}
      >
        <Text style={watchNameStyle}>{competitionName}</Text>
        <Text style={orderStyle}>ORDER : {orderId}</Text>
        <Hr />
        {/* you can render as many order details as you want */}

        <OrderDetails
          key={orderDetails.ticketValue}
          quantity={orderDetails.quantity}
          ticketValue={orderDetails.ticketValue}
          ticketsIds={orderDetails.ticketsIds}
        />
        <Hr />
        <Qrcode />
      </Section>
    </Section>
  );
}

function OrderDetails({ quantity, ticketValue, ticketsIds }: OrderDetailsType) {
  return (
    <Section
      style={{
        margin: '15px 0',
      }}
    >
      <Row>
        <Column>
          <Text style={orderStyle}>Quantity :</Text>
        </Column>
        <Column>
          <Text
            style={{ ...detailsStyle, textTransform: 'none', textAlign: 'end' }}
          >
            x{quantity}
          </Text>
        </Column>
      </Row>
      <Row>
        <Column>
          <Text style={orderStyle}>Ticket Value :</Text>
        </Column>
        <Column>
          <Text style={{ ...detailsStyle, textAlign: 'end' }}>
            {formatPrice(ticketValue)}
          </Text>
        </Column>
      </Row>
      <Row>
        <Column>
          <Text style={orderStyle}>Ticket number :</Text>
        </Column>
        <Column>
          {ticketsIds.map((ticketNumber, index) => (
            <Text key={index} style={{ ...detailsStyle, textAlign: 'end' }}>
              {ticketNumber}
            </Text>
          ))}
        </Column>
      </Row>
    </Section>
  );
}

const watchNameStyle = {
  fontWeight: 'bold',
  fontSize: '20px',
  color: '#1D1B1C',
  textTransform: 'capitalize' as const,
};

const orderStyle = {
  fontWeight: 'normal',
  fontSize: '16px',
  color: '#898989',
  textTransform: 'capitalize' as const,
  lineHeight: 0,
};

const detailsStyle = {
  ...watchNameStyle,
  lineHeight: 0.5,
};
