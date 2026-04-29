/* eslint-disable  */

import styles from '@/styles/Home.module.css';
import type { GetStaticPropsContext } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';

export default function NotFound() {
  const router = useRouter();
  const navColor = 'white';
  const [anchorLanguageEl, setAnchorLanguageEl] = useState<null | HTMLElement>(
    null,
  );
  return (
    <div
      style={{
        textAlign: router.locale === 'il' ? 'right' : 'left',
      }}
    >
      {router.locale === 'en' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'fit-content',
            width: '100%',
            backgroundColor: '#a8957e',
            color: 'white',
            padding: '15px',
            fontFamily: 'Montserrat',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          Notice: This website is currently unavailable for British residents
        </div>
      )}
      <div className={styles.HomeHeader}>
        <div
          className={styles.NavBarContainer}
          style={{
            color: navColor,
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${navColor}`,
            }}
            className={styles.flexStart}
          ></div>

          <Image
            width={200}
            height={105.42}
            className={styles.Logo}
            onClick={() => router.push('/')}
            priority
            alt='logo'
            style={{
              cursor: 'pointer',
              filter: navColor === 'white' ? 'brightness(0) invert(1)' : '',
              marginBottom: '-20px',
            }}
            src={`/images/logo.png`}
          />

          <div
            style={{
              borderBottom: `1px solid ${navColor}`,
            }}
            className={styles.flexEnd}
          >
            <div>
              <Image
                width={15}
                onClick={(e) => {
                  setAnchorLanguageEl(e.currentTarget);
                }}
                style={{
                  filter: navColor === 'white' ? 'brightness(0) invert(1)' : '',
                }}
                height={15}
                alt='global'
                src='/images/global.png'
              />

              <Menu
                id='basic-menu'
                anchorEl={anchorLanguageEl}
                open={anchorLanguageEl !== null}
                onClose={() => setAnchorLanguageEl(null)}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                {[
                  {
                    name: '🇬🇧\tEnglish',
                    locale: 'en',
                  },
                  {
                    name: '🇪🇸\tEspañol',
                    locale: 'es',
                  },
                  {
                    name: '🇫🇷\tFrançais',
                    locale: 'fr',
                  },
                  {
                    //japenese
                    name: '🇯🇵\t日本語',
                    locale: 'ja',
                  },
                ]
                  .filter(({ locale }) => locale !== router.locale)
                  .map(({ locale, name }, index) => (
                    <MenuItem
                      onClick={async () => {
                        //console.log("new local :" + code);
                        setAnchorLanguageEl(null);
                        const { pathname, asPath, query, push } = router;
                        return await push({ pathname, query }, asPath, {
                          locale,
                        });
                      }}
                      key={index}
                    >
                      {name}
                    </MenuItem>
                  ))}
              </Menu>
            </div>
          </div>
        </div>{' '}
        <div className={styles.vid}>
          <div className={styles.headerback}></div>

          <video width='100%' height='100%' autoPlay playsInline muted loop>
            <source
              src='/images/professional-watches-cosmograph-daytona-cover-video_portrait.webm'
              type='video/webm'
            />
            <source
              src='/images/professional-watches-cosmograph-daytona-cover-video_portrait.mp4'
              type='video/mp4'
            />
            <source
              src='/images/professional-watches-cosmograph-daytona-cover-video_portrait.mov'
              type='video/quicktime'
            />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className={styles.HeaderTit}>
          <h2 className={styles.background}>winuwatch</h2>
          <h1>We are not available in your region</h1>
        </div>
        <div className={styles.HeaderTit}></div>
      </div>
      <div
        style={{
          width: '100%',
          height: '50vh', // Replace with the actual height
          background: '#a8957e',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className={styles.FooterTop}>
          <Image
            className={styles.footerLogo}
            width={144}
            height={76}
            src='/images/newLogo.png'
            alt='logo'
          />
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`../../messages/${locale}.json`)).default,
    },
  };
}
