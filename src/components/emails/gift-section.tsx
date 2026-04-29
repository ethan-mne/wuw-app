import { Column, Img, Row, Section, Text } from '@react-email/components';
import { baseUrl } from './base-url';
import { CustomButton } from './custom-button';

export function GiftSection({
  buyer_name,
  message,
}: {
  buyer_name: string;
  message?: string;
}) {
  return (
    <Section
      style={{
        width: '570px',
        marginTop: '20px',
        marginBottom: '80px',
      }}
    >
      <Row
        align='center'
        style={{
          margin: '40px auto',
        }}
      >
        <Column>
          <Img
            src={`${baseUrl}/new-images/heart.png`}
            alt='heart'
            width='176'
            height='152'
            style={{
              width: '176px',
              height: '152px',
              maxWidth: '176px',
            }}
          />
        </Column>
        <Column
          style={{
            paddingLeft: '20px',
          }}
        >
          <Text style={titleText}>
            You Received{' '}
            <span style={{ color: '#E30F0F' }}>A Gift Ticket </span>to enter the
            competition
          </Text>
          <Text style={senderText}>From</Text>
          <Text style={senderText}>{buyer_name}</Text>
        </Column>
      </Row>
      {message ? (
        <Text style={text}>{message}</Text>
      ) : (
        <>
          {' '}
          <Text style={text}>
            Surprise! 🎉 I wanted to gift you something special, and what&apos;s
            more thrilling than the chance to win a dream watch? This ticket is
            a little token of love and luck—may it bring you all the excitement
            and joy in the world. Good luck, my dear. Can&apos;t wait to share
            the excitement with you !
          </Text>
          <Text style={text}>With all my love,</Text>{' '}
        </>
      )}
      <CustomButton
        href={`${baseUrl}/account/dashboard`}
        title='Access to your personal space'
      />
    </Section>
  );
}

const titleText = {
  fontWeight: 'bold',
  fontSize: '24px',
  color: '#1D1B1C',
  textTransform: 'uppercase' as const,
};

const senderText = {
  fontWeight: 'bold',
  fontSize: '18px',
  color: '#1D1B1C',
  textTransform: 'capitalize' as const,
  lineHeight: 0.5,
};

const text = {
  fontWeight: 'medium',
  fontSize: '17px',
  color: '#898989',
  lineHeight: '32px',
};
