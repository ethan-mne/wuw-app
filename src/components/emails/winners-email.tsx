import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Font,
  Text,
  Row,
  Column,
  Img,
  Button,
} from '@react-email/components';
import { EmailHeader } from './header';
import { EmailFooter } from './footer';
import { baseUrl } from './base-url';
import { CustomButton } from './custom-button';
import { CompetitionInfo } from './competition-info';

interface WinnersEmailProps {
  userName: string;
  countryCode: string;
  competitionName: string;
  liveDrawLink: string;
  watchImage: string;
  watchName: string;
  nextWatchName: string;
  nextWatchImage: string;
  nextWatchMaxTickets: number;
  nextWatchValue: number;
  nextWatchEntryPrice: number;
}

export function WinnersEmail({
  userName,
  countryCode,
  competitionName,
  liveDrawLink,
  watchImage,
  nextWatchEntryPrice,
  nextWatchImage,
  nextWatchMaxTickets,
  nextWatchName,
  nextWatchValue,
}: WinnersEmailProps) {
  return (
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
      <Preview>Gift Ticket Email</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />
          {/* sub header */}
          <>
            <Text
              style={{
                textAlign: 'center' as const,
                fontWeight: 'bold',
                fontSize: '24px',
                color: '#1D1B1C',
                textTransform: 'uppercase',
                marginTop: '30px',
              }}
            >
              #{competitionName}th winner
            </Text>
            <Text
              style={{
                width: '371px',
                textAlign: 'center' as const,
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#898989',
                margin: '0 auto',
              }}
            >
              We are proud to announce that the winner of the #{competitionName}{' '}
              competition is
            </Text>
            <Row
              style={{
                width: '371px',
                marginBottom: '20px',
              }}
            >
              <Column
                style={{
                  paddingLeft: '50px',
                }}
              >
                <Text
                  style={{
                    textAlign: 'center' as const,
                    fontWeight: 'bold',
                    fontSize: '20px',
                    color: '#1D1B1C',
                    textTransform: 'uppercase',
                  }}
                >
                  #{countryCode}
                </Text>
              </Column>
              <Column>
                <Text
                  style={{
                    textAlign: 'center' as const,
                    fontWeight: 'bold',
                    fontSize: '32px',
                    color: '#00D273',
                    textTransform: 'uppercase',
                  }}
                >
                  {userName}
                </Text>
              </Column>
            </Row>
          </>
          {/* live draw  */}
          <>
            <Img
              src={watchImage}
              alt='watch-image'
              style={{
                width: '600px',
                height: '369px',
                maxWidth: '600px',
                objectFit: 'cover',
                objectPosition: 'center',
                marginBottom: 0,
              }}
            />
            <Button
              href={liveDrawLink}
              style={{
                width: '601px',
                height: '85px',
                backgroundColor: '#1D1B1C',
                marginTop: 0,
                textAlign: 'center',
              }}
            >
              <Row
                style={{
                  width: '170px',
                  borderBottom: '1px solid white',
                  marginTop: '10px',
                }}
              >
                <Column style={{}}>
                  <Img
                    src={`${baseUrl}/new-images/play-icon.png`}
                    alt='watch-image'
                    style={{
                      width: '18px',
                      height: '18px',
                      maxWidth: '18px',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                </Column>
                <Column>
                  <Text
                    style={{
                      textAlign: 'center' as const,
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: '#fff',
                    }}
                  >
                    Relive the draw
                  </Text>
                </Column>
                <Column>
                  <Img
                    src={`${baseUrl}/new-images/live-icon.png`}
                    alt='watch-image'
                    style={{
                      width: '12x',
                      height: '12px',
                      maxWidth: '12px',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                </Column>
              </Row>
            </Button>
          </>

          {/* what is next section */}
          <>
            <Text
              style={{
                textAlign: 'center' as const,
                fontWeight: 'bold',
                fontSize: '32px',
                color: '#00D273',
                textTransform: 'uppercase',
                margin: '40px auto',
              }}
            >
              {userName.split(' ')[0]}{' '}
              <span style={{ color: '#1D1B1C' }}>first reaction </span>
            </Text>

            <Text
              style={{
                width: '440px',
                textAlign: 'left' as const,
                fontWeight: 'medium',
                fontStyle: 'italic',
                fontSize: '26px',
                color: '#1D1B1C',
                margin: '50px auto',
                letterSpacing: '0px',
                lineHeight: '40px',
              }}
            >
              Holy #shit@! I won the damn watch! Are you f***ing kidding me?
              This is way better than if I&apos;d bought it! Unbelievable!&quot;
            </Text>

            <Text
              style={{
                textAlign: 'center' as const,
                fontWeight: 'bold',
                fontSize: '44px',
                color: '#1D1B1C',
                textTransform: 'uppercase',
                margin: '40px auto',
              }}
            >
              What’s <span style={{ color: '#00D273' }}>NEXT ?</span>
            </Text>
            <div
              style={{
                position: 'relative',
                maxWidth: '601px',
                width: '601px',
                height: '471px',
              }}
            >
              <Img
                src={nextWatchImage}
                alt='watch-image'
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
              {/* <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#D9D9D9',
                position: 'absolute',
                opacity: "30%",
                left: "0px",
                right: "0px",
                top: 0
              }} /> */}
              {/* <Text style={{
                textAlign: 'center' as const,
                fontWeight: 'medium',
                fontSize: '14px',
                color: '#1D1B1C',
                textTransform: 'uppercase',
                letterSpacing: '5px',
                position: 'absolute',
                top: "10px",
                left: "0px",
                right: "0px",
              }}>#ONLY THOSE WHO PLAY END UP WINNING</Text> */}
            </div>
            <Text
              style={{
                textAlign: 'center' as const,
                fontWeight: 'bold',
                fontSize: '20px',
                color: '#1D1B1C',
                textTransform: 'uppercase',
                margin: '20px auto',
              }}
            >
              {nextWatchName}
            </Text>
            <CompetitionInfo
              nextWatchEntryPrice={nextWatchEntryPrice}
              nextWatchValue={nextWatchValue}
              nextWatchMaxTickets={nextWatchMaxTickets}
            />
            <div
              style={{
                textAlign: 'center' as const,
              }}
            >
              <CustomButton
                href={`${baseUrl}`}
                title='Enter competition'
                style={{
                  margin: '30px auto',
                }}
              />
            </div>

            <Text
              style={{
                textAlign: 'center' as const,
                fontWeight: 'bold',
                fontSize: '20px',
                marginBottom: '50px',
                color: '#7C7C7C',
                lineHeight: '31px',
              }}
            >
              We&apos;ve been eagerly awaiting for 6 months to finally have one,
              and this is the first time we&apos;re making it available. Tickets
              flew off the shelves upon release on our site. Get yours before
              they vanish, and we&apos;ll see you in a few days for the 19th
              live draw.
            </Text>
          </>
          {/* talk to tou soon */}
          <>
            <Text
              style={{
                textAlign: 'center' as const,
                fontWeight: 'bold',
                fontSize: '36px',
                textTransform: 'uppercase',
                color: '#1D1B1C',
              }}
            >
              Talk to you <span style={{ color: '#00D273' }}>soon !</span>
            </Text>
            <Img
              src={`${baseUrl}/new-images/default-author.png`}
              alt='winuwacth-logo'
              width='54'
              height='54'
              style={{ margin: '50px auto 10px auto' }}
            />
            <Text
              style={{
                textAlign: 'center' as const,
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: '50px',
                color: '#1D1B1C',
              }}
            >
              WINUWATCH family
            </Text>
          </>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#fffff',
};

const container = {
  margin: '30px auto',
  backgroundColor: '#fff',
  overflow: 'hidden',
};
