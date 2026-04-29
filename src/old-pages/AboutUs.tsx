/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable  @typescript-eslint/restrict-template-expressions */
// import Footer from '@/components/Footer';
// import NavBar from '@/components/NavBar';
import Head from 'next/head';
import styles from '@/styles/Philosophy.module.css';
import { Fade } from '@mui/material';
import { useTranslations } from 'next-intl';
import type { GetStaticPropsContext } from 'next';
import { useRouter } from 'next/router';
export default function About() {
  const router = useRouter();
  const t = useTranslations('philosophy');
  return (
    <div
      style={{
        textAlign: router.locale === 'il' ? 'right' : 'left',
      }}
    >
      <Head>
        <title>Win u Watch - About Us</title>
        <meta name='description' content='Win u Watch About Us' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      {/* <NavBar /> */}
      <div className={styles.philoMain}>
        <div
          style={{
            background:
              router.locale === 'en'
                ? 'linear-gradient( 180deg, #faf8f6 30%, rgba(206, 198, 189, 0) 35.83%, #a8957e 80% )'
                : 'linear-gradient( 180deg, #faf8f6 30%, rgba(206, 198, 189, 0) 50.83%, #a8957e 100% )',
          }}
          className={styles.About}
        >
          <Fade in={true}>
            <div
              style={{
                gap: '2rem',
              }}
              className={styles.philoHeader}
            >
              <div>
                <h1
                  style={{
                    lineHeight: 'none',
                  }}
                >
                  Dear everyone,
                </h1>
                <h2>
                  I have spent months thinking and reflecting on the functioning
                  of Winuwatch.
                </h2>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <p
                  style={{
                    fontWeight: '275',
                    width: '90%',
                    fontSize: '23px',
                  }}
                >
                  While my lawyer was tirelessly dealing with the British
                  authorities to obtain the necessary authorizations and legal
                  opinion to implement the luxury watch-focused contest idea, I
                  was progressing in my mind:{' '}
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <li>How will the game be perceived?</li>
                  <li
                    style={{
                      width: '90%',
                    }}
                  >
                    How will people initially trust me in a world where we can
                    no longer distinguish the true from the false?
                  </li>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <p
                    style={{
                      fontWeight: '275',
                      fontSize: '23px',
                    }}
                  >
                    So, I have considered the following points:
                  </p>
                  <p
                    style={{
                      fontSize: '23px',
                      width: '90%',
                    }}
                  >
                    1/ How can we determine if the watches offered by Winuwatch
                    are genuine?
                  </p>
                  <p
                    style={{
                      fontWeight: '275',
                      fontSize: '23px',
                    }}
                  >
                    We operate under British regulation and therefore undergo
                    constant monitoring. We provide a certificate of
                    authenticity, the original box and papers, as well as a
                    Rolex warranty. Furthermore, I want WinUWatch to thrive,
                    expand its community, and diversify its prizes. That&apos;s
                    why I work with complete transparency. You know the history,
                    objectives, motivations, and even the face of WinUWatch.
                    Today, with platforms like Facebook, Twitter, Instagram, and
                    TikTok, the concept will quickly become known. Once I have
                    delivered one, two, three watches, even the most cautious
                    individuals will be reassured.
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '23px',
                    }}
                  >
                    2/ I have opted for the safest payment and access options:
                    100% secure platforms like PayPal, Stripe, and Apple Pay!
                  </p>
                  <p
                    style={{
                      fontWeight: '275',
                      fontSize: '23px',
                    }}
                  >
                    Furthermore, I prefer that you be charged for your purchase
                    through these platforms, while I receive payment from them 4
                    to 5 days later, to further forge trust.
                  </p>
                </div>
                <p
                  style={{
                    fontSize: '23px',
                  }}
                >
                  3/ After extensive research, I selected Randomdraws as the
                  only globally recognized and authorized platform for
                  conducting this type of lottery under legal audit.
                </p>
                <p
                  style={{
                    fontSize: '23px',
                  }}
                >
                  4/ Lastly, I thought the idea was brilliant – to win a prize
                  worth €20,000 or €70,000 for just €20 or €50. People will love
                  it! It sparks dreams!
                </p>
                <div>
                  <p
                    style={{
                      fontSize: '23px',
                    }}
                  >
                    5/ The remaining task was to decide on the product to
                    highlight.
                  </p>
                  <p
                    style={{
                      fontWeight: '275',
                      fontSize: '23px',
                    }}
                  >
                    Travel? People may not always be available or agree with the
                    chosen destination. A car? But how do we deliver a car to
                    Canada or, worse, if it is won in England with right-hand
                    drive? So, I realized that luxury watches were the obvious
                    choice. A timeless piece that can increase in value!
                  </p>
                </div>
              </div>
            </div>
          </Fade>
          <div
            style={{
              marginBottom: '80px',
            }}
            className={styles.philoBotTxt}
          >
            <p
              style={{
                fontSize: '23px',
                fontWeight: '400',
              }}
            >
              The authorities imposed several constraints on me that have become
              marketing assets! <br />
              For instance, setting a maximum number of tickets per person and
              indicating the maximum number of tickets for sale in each
              competition. Additionally, ensuring the draw takes place
              regardless of the number of tickets sold! Moreover, fixing the
              date of the draw from the launch of the competition…
              <br />
              Awesome thanks to the authorities!! Thanks to them <br />I
              understood that this was the true meaning of the game:
            </p>
            <p
              style={{
                fontSize: '23px',
                fontWeight: '400',
              }}
            >
              Instead of having a one in x million chance of winning like the
              lottery, people will quickly understand that with Winuwatch the
              chance of winning is real, much more accessible and more
              interesting, there is always a winner in each competition!
            </p>
            <h1
              style={{
                fontSize: '35px',
              }}
            >
              Thank you, thank you to all of you! <br />
              The game has become a true phenomenon in four countries already,
              and it is all thanks to you. At each competition, there will be a
              winner who will realize his dream at the price of a swatch!
            </h1>
            <p
              style={{
                fontSize: '23px',
                fontWeight: '400',
              }}
            >
              Good luck to everyone. <br />
              Sincerely,
              <br />
              Laurent K, founder of Winuwatch.
            </p>
          </div>
        </div>
        <div className={styles.AboutImg}></div>
      </div>
      {/* <Footer /> */}
    </div>
  );
}

// export async function getStaticProps({ locale }: GetStaticPropsContext) {
//   return {
//     props: {
//       messages: (await import(`../../messages/${locale}.json`)).default,
//     },
//   };
// }
