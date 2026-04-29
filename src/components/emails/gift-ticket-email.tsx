import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Font,
} from '@react-email/components';
import { EmailHeader } from './header';
import { EmailFooter } from './footer';
import { WhatHappensNow } from './what-happens-section';
import { TicketDetails } from './ticket-details';
import { CustomButton } from './custom-button';
import { baseUrl } from './base-url';
import { GiftSection } from './gift-section';
import { ConfirmationEmailProps } from '@/lib/interfaces';

export function GiftTicketEmail({
  message,
  userName,
  code,
  ticketDetails,
}: ConfirmationEmailProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily='Helvetica Neue,Helvetica, sans-serif'
          fallbackFontFamily='Helvetica'
          // webFont={{
          //   url: `${baseUrl}/fonts/HelveticaNeueBold.ttf`,
          //   format: "woff2",
          // }}
          fontWeight={700}
          fontStyle='bold'
        />
      </Head>
      <Preview>Gift Ticket Email</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />
          <GiftSection buyer_name={userName} message={message} />
          <TicketDetails {...ticketDetails} />
          <Section
            style={{
              textAlign: 'center' as const,
            }}
          >
            <CustomButton
              href={`${baseUrl}/account/dashboard`}
              title='Access to your personal space'
              style={{
                margin: '40px 0 80px  0 ',
              }}
            />
          </Section>

          <WhatHappensNow date={ticketDetails.competitionDate} />
          <CustomButton
            href={`${baseUrl}/account/dashboard`}
            title='Access to your personal space'
            style={{
              margin: '0 0 80px 60px',
            }}
          />
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#fffff',
};

const container = {
  margin: '30px auto',
  backgroundColor: '#fff',
  overflow: 'hidden',
};
