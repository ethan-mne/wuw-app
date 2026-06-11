import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { requireAdminSession } from '@/server/admin/auth.service';
import { MobileHttpError } from '@/server/mobile/http';
import styles from '@/styles/Dashboard.module.css';

type DashboardLayoutProps = {
  children: ReactNode;
};

const DASHBOARD_ENTRY_PATH = '/dashboard/competitions/schedule';
const DASHBOARD_SIGNIN_PATH = `/api/auth/signin?callbackUrl=${encodeURIComponent(DASHBOARD_ENTRY_PATH)}`;

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  try {
    await requireAdminSession();
  } catch (error) {
    if (error instanceof MobileHttpError) {
      if (error.status === 401) {
        redirect(DASHBOARD_SIGNIN_PATH);
      }
      if (error.status === 403) {
        redirect('/?error=admin_required');
      }
    }
    throw error;
  }

  return (
    <div className={styles.MainCon}>
      <aside className={styles.Dashboard}>
        <div className={styles.menusWrap}>
          <div className={styles.sidebarHeader}>
            <p className={styles.sidebarEyebrow}>Admin</p>
            <h1 className={styles.sidebarTitle}>Dashboard</h1>
          </div>
          <div className={styles.Dashmenus}>
            <Link className={`${styles.Menu} ${styles.MenuActive}`} href="/dashboard/competitions/schedule">
              <span className={styles.menuLabel}>Competition Schedule</span>
            </Link>
          </div>
        </div>
      </aside>
      <main className={styles.dashBody}>
        <div className={styles.topBar}>
          <Link className={styles.brandMark} href="/">
            WINU
          </Link>
          <nav className={styles.topMenu} aria-label="Dashboard sections">
            <Link className={`${styles.Menu} ${styles.MenuActive}`} href="/dashboard/competitions/schedule">
              <span className={styles.menuLabel}>Competition Schedule</span>
            </Link>
          </nav>
        </div>
        <header className={styles.pageHeader}>
          <p className={styles.pageEyebrow}>Admin</p>
          <h2 className={styles.pageTitle}>Competition Schedule</h2>
        </header>
        <div className={styles.Body}>{children}</div>
      </main>
    </div>
  );
}
