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

interface RefundConfirmationEmailProps {
  orderNumber: string;
  competitionName: string;
  competitionImage: string;
  amount: string;
  currency: string;
  paymentMethod?: order_paymentMethod;
}

export function RefundConfirmationEmail({
  orderNumber,
  competitionName,
  competitionImage,
  amount,
  currency,
  paymentMethod,
}: RefundConfirmationEmailProps) {
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
      <Preview>Refund Confirmation for Your Order</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />
          <Section style={welcomeSection}>
            <Text style={welcomeTitle}>Refund Confirmed</Text>
            <Text style={welcomeDescription}>
              Your refund has been processed successfully
            </Text>
          </Section>

          <Section style={detailsSection}>
            <Text style={detailText}>Order Number: {orderNumber}</Text>
            <Text style={detailText}>Competition: {competitionName}</Text>
            <Text style={detailText}>
              Refund Amount: {amount} {currency}
            </Text>
            <Text style={supportText}>
              The refund should appear in your account within 5-10 business
              days.
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
  color: '#00D273',
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
