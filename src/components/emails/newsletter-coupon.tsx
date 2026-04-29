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
import { NewsLetterShareSection } from './newsletter-reduction-share-section';

export const NewsLetterCoupon = (code: string) => (
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
              <Text style={welcomeTitle}>25% OFF </Text>
            </Column>
            <Column>
              <Text style={{ ...welcomeTitle, color: '#00D273' }}>
                YOUR NEXT WATCH
              </Text>
            </Column>
          </Row>
          <Text style={welcomeDescription}>
            USE IT NOW AND SAVE 25% OFF YOUR NEXT ORDER
          </Text>
        </Section>
        {code && <NewsLetterShareSection code={code} />}
        <EmailFooter />
        {/* 
       
        />}
         */}
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
