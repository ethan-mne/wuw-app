import { Button, Text } from '@react-email/components';

type ButtonProps = React.ComponentPropsWithoutRef<'a'>;

export function CustomButton({ href, title, style: customStyle }: ButtonProps) {
  return (
    <Button href={href} style={{ ...container, ...customStyle }}>
      <Text
        style={{
          color: 'white',
          textAlign: 'center' as const,
          fontWeight: 'bold',
          fontSize: '18px',
          lineHeight: '32px',
        }}
      >
        {title}
      </Text>
    </Button>
  );
}

const container = {
  width: '340px',
  height: '64px',
  maxHeight: '64px',
  backgroundColor: '#1D1B1C',
  borderRadius: '5px',
  textAlign: 'center' as const,
};
