import {
  Body,
  Container,
  Column,
  Head,
  Html,
  Preview,
  Row,
  Section,
  Text,
  Font,
} from '@react-email/components';
import { EmailFooter } from './footer';
import { EmailHeader } from './header';
import { WhatHappensNow } from './what-happens-section';
import { LoginSection, ShareSection } from './share-section';
import { TicketDetails } from './ticket-details';
import type { ConfirmationEmailProps } from '@/lib/interfaces';
import { ImportantInfoSection } from './important-info-section';

export const ConfirmationEmail = ({
  userName,
  code,
  ticketDetails,
  paymentMethod,
}: ConfirmationEmailProps) => (
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
    <Preview>Confirmation Email</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailHeader />
        <Section style={welcomeSection}>
          <Row align='center' style={{ width: '580px' }}>
            <Column>
              <Text style={welcomeTitle}>YOU ARE OFFICIALLY</Text>
            </Column>
            <Column>
              <Text style={{ ...welcomeTitle, color: '#00D273' }}>IN !</Text>
            </Column>
          </Row>
          <Text style={welcomeDescription}>{userName}, THANK YOU !</Text>
          <Text style={welcomeDescription}>
            WE ARE PLEASED TO INFORM YOU THAT YOUR REGISTRATION HAS BEEN
            SUCCESSFULLY RECEIVED AND PROCESSED. YOU HAVE NOW OFFICIALLY ENTERED
            IN THE COMPETITION
          </Text>
        </Section>
        <TicketDetails {...ticketDetails} />
        <ImportantInfoSection paymentMethod={paymentMethod} />
        <WhatHappensNow date={ticketDetails.competitionDate} />
        {code ? <ShareSection code={code} /> : <LoginSection />}
        <EmailFooter />
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#fffff',
};

const container = {
  margin: '30px auto',
  backgroundColor: '#fff',
  overflow: 'hidden',
};

const welcomeSection = {
  height: '300px',
};

const welcomeTitle = {
  textAlign: 'center' as const,
  fontWeight: 'bold',
  fontSize: '44px',
  color: '#1D1B1C',
};

const welcomeDescription = {
  textAlign: 'center' as const,
  fontWeight: 'bold',
  fontSize: '18px',
  color: '#7C7C7C',
  textTransform: 'uppercase' as const,
};
