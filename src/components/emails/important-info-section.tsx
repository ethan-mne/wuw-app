import { Section, Text, Link } from '@react-email/components';
import type { order_paymentMethod } from '@prisma/client';
import { baseUrl } from './base-url';
import { getStatementDescriptor } from '@/lib/statement-descriptor';

export function ImportantInfoSection({
  paymentMethod,
}: {
  paymentMethod?: order_paymentMethod;
}) {
  const descriptor = getStatementDescriptor(paymentMethod);
  return (
    <Section style={container}>
      <Text style={title}>IMPORTANT REMINDERS</Text>

      <Text style={infoText}>
        {`This transaction will appear on your bank or credit card statement as ${descriptor} for easy identification.`}
      </Text>

      <Text style={infoText}>
        By purchasing a ticket, you have confirmed that:
      </Text>

      <Text style={bulletPoint}>
        • You are 18 years or older and have accepted the Terms and Conditions
        of Lisam Watch Ltd, including the non-refundable ticket policy. All
        ticket purchases are final and non-refundable.
      </Text>

      <Text style={bulletPoint}>
        • You have reviewed the competition rules and our eligibility policy.
      </Text>

      <Text style={bulletPoint}>
        • You understand that refunds will not be issued unless the competition
        is canceled by Lisam Watch Ltd.
      </Text>

      <Text style={infoText}>
        To review our Terms and Conditions in detail, please{' '}
        <Link href={`${baseUrl}/terms-and-conditions`} style={linkStyle}>
          click here
        </Link>
        .
      </Text>

      <Text style={title}>QUESTIONS OR CONCERNS?</Text>

      <Text style={contactText}>
        {`If you have any questions or concerns regarding this transaction, please don’t hesitate to contact us directly at contact@winuwatch.com. We are committed to resolving any issues promptly to ensure your satisfaction.`}
      </Text>
    </Section>
  );
}

const container = {
  padding: '30px 40px',
  backgroundColor: '#f8f8f8',
  margin: '20px 0',
  borderRadius: '5px',
};

const title = {
  textAlign: 'center' as const,
  fontWeight: 'bold',
  fontSize: '24px',
  color: '#1D1B1C',
  marginBottom: '20px',
};

const infoText = {
  fontSize: '16px',
  color: '#7C7C7C',
  marginBottom: '15px',
};

const bulletPoint = {
  fontSize: '16px',
  color: '#7C7C7C',
  marginBottom: '10px',
  paddingLeft: '20px',
};

const contactText = {
  fontSize: '16px',
  color: '#7C7C7C',
  marginTop: '20px',
  textAlign: 'center' as const,
};

const linkStyle = {
  color: '#00D273',
  textDecoration: 'underline',
};
