import { Img, Section, Text } from '@react-email/components';
import { baseUrl } from './base-url';

export function EmailHeader() {
  return (
    <Section style={container}>
      <Img
        src={`${baseUrl}/new-images/winuwatch-header-logo.png`}
        alt='winuwacth-logo'
        width='264'
        height='50.7'
        style={{ margin: '20px auto' }}
      />
      <Text style={subTitle}># LUXURY WATCH CONTEST</Text>
    </Section>
  );
}

const container = {
  width: '100%',
  height: '130px',
  backgroundColor: '#1D1B1C',
};

const subTitle = {
  textAlign: 'center' as const,
  fontWeight: 'lighter',
  fontSize: '11.82px',
  color: 'white',
  letterSpacing: '5px',
  lineHeight: 0,
};
