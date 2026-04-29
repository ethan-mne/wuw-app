'use client';

import styles from '@/styles/Dashboard.module.css';
import { HomeOutlined } from '@ant-design/icons';
import {
  MessageOutlined,
  ReconciliationOutlined,
  SettingOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
  BookOutlined,
  GiftOutlined,
} from '@ant-design/icons/lib/icons';
import Image from 'next/image';
import { useStore, Dashmenus, Othermenus } from './Store';

const DashboardMainNav = () => {
  const { menu: Menu, selectMenu } = useStore();

  return (
    <div className={styles.Dashboard}>
      <div className={styles.menusWrap}>
        <div className={styles.Dashmenus}>
          <span className={styles.menuCategory}>Main</span>
          {Dashmenus.map((menu, i) => {
            const isActive = Menu === menu;
            return (
              <div
                onClick={() => selectMenu(menu)}
                className={`${styles.Menu} ${isActive ? styles.MenuActive : ''}`}
                key={i}
              >
                {i === 0 ? (
                  <HomeOutlined />
                ) : i === 1 ? (
                  <ReconciliationOutlined />
                ) : i === 2 ? (
                  <TrophyOutlined />
                ) : i === 3 ? (
                  <BookOutlined />
                ) : i === 4 ? (
                  <UsergroupAddOutlined />
                ) : (
                  <GiftOutlined />
                )}
                <p>{menu}</p>
              </div>
            );
          })}
        </div>
        <div className={styles.Dashmenus}>
          <span className={styles.menuCategory}>Other</span>

          {Othermenus.map((menu, i) => {
            const isActive = Menu === menu;
            return (
              <div
                onClick={() => selectMenu(menu)}
                className={`${styles.Menu} ${isActive ? styles.MenuActive : ''}`}
                key={i}
              >
                {i === 0 ? <MessageOutlined /> : <SettingOutlined />}
                <p>{menu}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.logo}>
        <Image
          width={120}
          height={50}
          alt='logo'
          src='/images/FooterLogo.png'
        />
      </div>
    </div>
  );
};

export default DashboardMainNav;
