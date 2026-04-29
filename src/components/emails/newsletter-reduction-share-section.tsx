import {
  Button,
  Column,
  Img,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { baseUrl } from './base-url';

export function NewsLetterShareSection({ code }: { code: string }) {
  return (
    <Section style={container}>
      <Section style={{ width: '370px', height: '100%', textAlign: 'center' }}>
        <Row align='center' style={{ width: '250px' }}>
          <Column>
            <Img
              src={`${baseUrl}/new-images/barcode-logo.png`}
              alt='barcode-logo'
              width='116'
              height='47'
            />
          </Column>
          <Column
            style={{
              paddingLeft: '10px',
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: '20px',
                color: 'white',
              }}
            >
              Exclusive Reduction Code
            </Text>
          </Column>
        </Row>
        <Row align='center'>
          <Column>
            <Text style={textStyle}>
              Use this code to save 25%
              <span style={{ ...textStyle, color: '#00D273' }}>
                {' '}
                off your next order.
              </span>
            </Text>
          </Column>
        </Row>
        <Button style={codeButton}>
          <Row
            style={{
              margin: '8px auto',
            }}
          >
            <Column>
              <Text
                style={{
                  ...codeButtonText,
                }}
              >
                {code}
              </Text>
            </Column>
            <Column
              style={{
                paddingLeft: '10px',
              }}
            >
              <Img
                src={`${baseUrl}/new-images/clipboard-icon.png`}
                alt='clipboard-icon'
                width='24'
                height='24'
              />
            </Column>

            <Column
              style={{
                paddingLeft: '10px',
              }}
            >
              <Text
                style={{
                  ...codeButtonText,
                  textDecoration: 'underline',
                  textDecorationColor: '#00D273',
                  textUnderlineOffset: '8px',
                  color: 'white',
                }}
              >
                COPY CODE
              </Text>
            </Column>
          </Row>
        </Button>
      </Section>
    </Section>
  );
}

const container = {
  width: '100%',
  height: '471px',
  backgroundColor: '#1D1B1C',
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#898989',
  borderBottomWidth: '2px',
};

const whatsappButton = {
  width: '271px',
  height: '65px',
  border: 'solid 1px white',
  borderRadius: '50px',
  margin: '30px auto',
};

const codeButton = {
  width: '366px',
  height: '77px',
  border: 'solid 1px white',
  background:
    'linear-gradient(to bottom, rgba(255, 255, 255, 0.1), transparent)',
};

const textStyle = {
  textAlign: 'center' as const,
  fontWeight: 'bold',
  fontSize: '15px',
  color: '#DBE5E0',
};

const codeButtonText = {
  fontWeight: 'bold',
  fontSize: '20px',
  color: 'white',
  textTransform: 'uppercase' as const,
};
