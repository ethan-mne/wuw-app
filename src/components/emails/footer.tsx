import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { baseUrl } from './base-url';

export function EmailFooter() {
  const navigationLinks = [
    { href: `${baseUrl}/howtoplay`, text: 'Playing Rules' },
    { href: `${baseUrl}/philosophy`, text: 'Philosophy' },
    // { href: `${baseUrl}/engagement`, text: 'Engagement' },
    { href: `${baseUrl}/feed`, text: 'Feed' },
    { href: `/faq`, text: 'Faq' },
    {
      href: `${baseUrl}/about-us`,
      text: 'About us',
    },
  ];

  const privacyLinks = [
    {
      href: `${baseUrl}/acceptable-use-policy`,
      text: 'Acceptable use policy',
    },
    { href: `${baseUrl}/terms-and-conditions`, text: 'Terms & conditions' },
    { href: `${baseUrl}/return-policy`, text: 'Return policy' },
    { href: `${baseUrl}/privacy-policy`, text: 'Privacy policy' },
    {
      href: `${baseUrl}/refund-and-cancellation`,
      text: 'Refund & Cancellation Policy',
    },
  ];
  return (
    <Section>
      <Section style={instagramSection}>
        <Img
          src={`${baseUrl}/new-images/instagram-wordmark.png`}
          alt='instagram-wordmark'
          width='182'
          height='68'
          style={{ margin: '0 auto' }}
        />

        <Text
          style={{
            textAlign: 'center',
            fontSize: '15px',
            fontWeight: 'bold',
            color: '#00D273',
          }}
        >
          JOIN OUR COMMUNITY
        </Text>
        <Link href='https://www.instagram.com/winuwatch/'>
          <Text
            style={{
              textDecoration: 'underline',
              textDecorationColor: 'white',
              textUnderlineOffset: '8px',
              color: 'white',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            JOIN OUR COMMUNITY
          </Text>
          <Img
            src={`${baseUrl}/new-images/instagram-logo.png`}
            alt='instagram-logo'
            width='34'
            height='34'
            style={{
              margin: '0 auto',
            }}
          />
        </Link>
      </Section>
      <Hr style={{ ...hrstyle1, marginBottom: '4px' }} />
      <Hr style={{ ...hrstyle2, marginBottom: '20px' }} />
      <Row align='center'>
        {navigationLinks.map((link) => (
          <Column key={link.text} style={{ padding: '0 6px' }}>
            <Link href={link.href} style={linkNavigationStyle}>
              {link.text}
            </Link>
          </Column>
        ))}
      </Row>
      <Section style={{ margin: '30px 0' }}>
        <Img
          src={`${baseUrl}/new-images/winuwatch-logo.png`}
          alt='logo'
          width='549'
          height='105.43'
          style={{
            margin: '0 auto',
          }}
        />
        <Text style={subTitle}># LUXURY WATCH CONTEST</Text>
      </Section>
      <Row
        align='center'
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {privacyLinks.map((link) => (
          <Column
            key={link.text}
            style={{ padding: '0 6px', textAlign: 'center' }}
          >
            <Link href={link.href} style={linkStyle}>
              {link.text}
            </Link>
          </Column>
        ))}
      </Row>
      <Row
        align='center'
        style={{
          width: '180.97px',
        }}
      >
        <Column style={{ paddingRight: '6px' }}>
          <Img
            src={`${baseUrl}/new-images/copy-right.png`}
            alt='Copyright'
            width='18'
            height='18'
          />
        </Column>
        <Column style={{ paddingRight: '6px' }}>
          <Text
            style={{ fontSize: '20px', fontWeight: 'bold', color: '#1D1B1C' }}
          >
            WINUWATCH
          </Text>
        </Column>
        <Column style={{ paddingRight: '6px' }}>
          <Text
            style={{ fontSize: '12px', fontWeight: 'normal', color: '#6b7280' }}
          >
            {new Date().getFullYear()}
          </Text>
        </Column>
      </Row>
      <Text style={locationTextStyle}>
        Lisam Watch Ltd is registered at 63-66 Hatton Gardens, Fifth Floor,
        Suite 23, London, England, EC1N 8LE
      </Text>
    </Section>
  );
}

const locationTextStyle = {
  fontSize: '12px',
  fontWeight: 'normal',
  color: '#6b7280',
  margin: '0 auto',
  textAlign: 'center' as const,
};

const linkStyle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#6b7280',
};

const linkNavigationStyle = {
  fontSize: '14.71px',
  color: '#000000',
  fontWeight: 'bold',
};

const hrstyle1 = {
  display: 'block',
  height: '2px',
  border: 0,
  borderTop: '2px solid #1D1B1C',
  padding: 0,
  width: '100%',
};

const hrstyle2 = {
  display: 'block',
  height: '4px',
  border: 0,
  borderTop: '4px solid #1D1B1C',
  padding: 0,
  width: '100%',
};

const subTitle = {
  textAlign: 'center' as const,
  fontWeight: 'lighter',
  fontSize: '24.57px',
  color: '#1D1B1C',
  letterSpacing: '10px',
};

const instagramSection = {
  width: '100%',
  height: '292px',
  gap: '1rem',
  backgroundColor: '#1D1B1C',
  marginBottom: '25px',
};
