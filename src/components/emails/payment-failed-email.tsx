import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Font,
} from '@react-email/components';
import type { order_paymentMethod } from '@prisma/client';
import { EmailHeader } from './header';
import { EmailFooter } from './footer';
import { ImportantInfoSection } from './important-info-section';

interface PaymentFailedEmailProps {
  orderNumber: string;
  competitionName: string;
  competitionImage: string;
  reason: string;
  paymentMethod?: order_paymentMethod;
}

export function PaymentFailedEmail({
  orderNumber,
  competitionName,
  competitionImage,
  reason,
  paymentMethod,
}: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily='Helvetica Neue,Helvetica, sans-serif'
          fallbackFontFamily='Helvetica'
          fontWeight={700}
          fontStyle='bold'
        />
      </Head>
      <Preview>Payment Failed for Your Order</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />
          <Section style={welcomeSection}>
            <Text style={welcomeTitle}>Payment Failed</Text>
            <Text style={welcomeDescription}>
              {`We're sorry, but the payment for your order has failed.`}
            </Text>
          </Section>

          <Section style={detailsSection}>
            <Text style={detailText}>Order Number: {orderNumber}</Text>
            <Text style={detailText}>Competition: {competitionName}</Text>
            <Text style={detailText}>Reason: {reason}</Text>
            <Text style={supportText}>
              Please try again or contact our support team if you need
              assistance.
            </Text>
          </Section>

          <ImportantInfoSection paymentMethod={paymentMethod} />
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
};

const container = {
  margin: '30px auto',
  backgroundColor: '#fff',
  overflow: 'hidden',
};

const welcomeSection = {
  textAlign: 'center' as const,
  margin: '40px 0',
};

const welcomeTitle = {
  fontWeight: 'bold',
  fontSize: '32px',
  color: '#E30F0F',
};

const welcomeDescription = {
  fontSize: '18px',
  color: '#7C7C7C',
  marginTop: '20px',
};

const detailsSection = {
  padding: '30px 40px',
  margin: '20px 0',
};

const detailText = {
  fontSize: '16px',
  color: '#1D1B1C',
  marginBottom: '15px',
};

const supportText = {
  fontSize: '16px',
  color: '#7C7C7C',
  marginTop: '30px',
};
