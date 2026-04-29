import { Column, Img, Row, Section, Text } from '@react-email/components';
import { baseUrl } from './base-url';
import { format } from 'date-fns';

export function WhatHappensNow({ date }: { date: Date }) {
  return (
    <Section>
      <Row align='center' style={{ width: '510px' }}>
        <Column>
          <Text style={title}>What happens</Text>
        </Column>
        <Column>
          <Text style={{ ...title, color: '#00D273' }}>now ?</Text>
        </Column>
      </Row>
      <Img
        src={`${baseUrl}/new-images/what-happens.png`}
        alt='winuwacth-logo'
        width='600'
        height='232'
        style={{ margin: '10px auto' }}
      />
      <Section
        style={{
          width: '480px',
          marginBottom: '30px',
        }}
      >
        <Text
          style={{
            fontWeight: 'normal',
            fontSize: '16px',
            color: '#898989',
            lineHeight: 0,
          }}
        >
          Competition date :
        </Text>
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#1D1B1C',
            letterSpacing: '-0.5px',
          }}
        >
          {format(
            date,
            "EEEE, MMMM d, yyyy 'AT' h:mm a '(LOCAL TIME IN LONDON)'",
          )}
        </Text>
        <Row align='left' style={{ display: 'flex' }}>
          <Column>
            <Text style={{ ...title, fontSize: '24px' }}>experience</Text>
          </Column>
          <Column style={{ paddingLeft: '10px' }}>
            <Text style={{ ...title, color: '#00D273', fontSize: '24px' }}>
              the live draw
            </Text>
          </Column>
        </Row>
        <Text style={liveDrawText}>
          Keep an eye on your inbox for an upcoming email, inviting you to
          experience the live draw with us and possibly win the watch
          you&apos;ve always desired.
        </Text>
      </Section>
    </Section>
  );
}

const title = {
  textAlign: 'center' as const,
  fontWeight: 'bold',
  fontSize: '44px',
  color: '#1D1B1C',
  textTransform: 'uppercase' as const,
};
const liveDrawText = {
  fontWeight: 'bold',
  fontSize: '16px',
  color: '#7C7C7C',
};
