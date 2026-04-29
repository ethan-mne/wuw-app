import { formatPrice } from '@/lib/formaters';
import { Column, Row, Text } from '@react-email/components';

export function CompetitionInfo({
  nextWatchMaxTickets,
  nextWatchValue,
  nextWatchEntryPrice,
}: {
  nextWatchMaxTickets: number;
  nextWatchValue: number;
  nextWatchEntryPrice: number;
}) {
  return (
    <Row
      style={{
        width: '312px',
        margin: '0 auto',
      }}
    >
      <Column
        style={{
          borderLeft: '1px solid #00D273',
          paddingLeft: '10px',
        }}
      >
        <Text style={valueText}>{nextWatchMaxTickets}</Text>
        <Text style={text}>Max Tickets</Text>
      </Column>
      <Column
        style={{
          borderLeft: '1px solid #00D273',
          paddingLeft: '10px',
        }}
      >
        <Text style={valueText}>{formatPrice(nextWatchValue)}</Text>
        <Text style={text}>Watch value</Text>
      </Column>
      <Column
        style={{
          borderLeft: '1px solid #00D273',
          paddingLeft: '10px',
        }}
      >
        <Text style={valueText}>{formatPrice(nextWatchEntryPrice)}</Text>
        <Text style={text}>Entry price</Text>
      </Column>
    </Row>
  );
}

const valueText = {
  fontWeight: 'bold',
  fontSize: '26px',
  color: '#1D1B1C',
  letterSpacing: '0px',
  lineHeight: '0px',
};

const text = {
  fontWeight: 'normal',
  fontSize: '13px',
  color: '#1D1B1C',
  letterSpacing: '0px',
  lineHeight: '0px',
  marginTop: '25px',
};
