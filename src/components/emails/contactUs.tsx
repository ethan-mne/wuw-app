import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from '@react-email/components';
import * as React from 'react';

export type TclientInfo = {
  clientInfo: {
    clientFirstName: string;
    clientLastName: string;
    clientEmail: string;
    clientPhone: string;
    clientMessage: string;
  };
};

export const ContactUsFormClient = ({ clientInfo }: TclientInfo) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Heading style={secondary}>Client needs help</Heading>
        <Text style={paragraph}>First name: {clientInfo.clientFirstName}</Text>
        <Text style={paragraph}>Last name: {clientInfo.clientLastName}</Text>
        <Text style={paragraph}>Email: {clientInfo.clientEmail}</Text>
        <Text style={paragraph}>Phone: {clientInfo.clientPhone}</Text>
        <Text style={paragraph}>Message: {clientInfo.clientMessage}</Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #eee',
  borderRadius: '5px',
  boxShadow: '0 5px 10px rgba(20,50,70,.2)',
  marginTop: '20px',
  maxWidth: '360px',
  margin: '0 auto',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '10px',
};

const secondary = {
  color: '#000',
  display: 'inline-block',
  fontFamily: 'HelveticaNeue-Medium,Helvetica,Arial,sans-serif',
  fontSize: '20px',
  fontWeight: 500,
  lineHeight: '24px',
  marginBottom: '30px',
  marginTop: '0',
};

const paragraph = {
  color: '#444',
  fontSize: '15px',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  letterSpacing: '0',
  lineHeight: '23px',
  margin: '0',
};
