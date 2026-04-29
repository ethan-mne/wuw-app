import { Column, Img, Row, Section, Text } from '@react-email/components';
import { baseUrl } from './base-url';

export function Qrcode() {
  return (
    <Section style={{ margin: '30px 0' }}>
      <Row>
        <Column>
          <Img
            src={`${baseUrl}/new-images/qrcode.png`}
            alt='QR Code'
            height={201}
            width={201}
            style={{
              width: '201px',
              height: '201px',
              maxWidth: '201px',
            }}
          />
        </Column>
        <Column
          style={{
            paddingLeft: '50px',
          }}
        >
          <Img
            src={`${baseUrl}/new-images/randomdraws-logo.png`}
            alt='randomdraws-logo'
            width='217'
            height='28'
          />
          <Text style={textStyle}>
            Our partner Randomdraws uses a Random Number Generator for an
            impartial and secure winner selection process.
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

const textStyle = {
  fontWeight: 'normal',
  fontSize: '16px',
  color: '#898989',
};
