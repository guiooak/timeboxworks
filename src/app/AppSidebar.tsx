import { useEffect, useState } from 'react';
import { NavLink, paths } from '../common/services/router';
import { useAuthStore } from '../features/auth';
import { useMeetingStore } from '../features/meeting/store';
import { Logo } from './Logo';
import styles from './AppSidebar.module.css';

const STORAGE_KEY = 'tw-sidebar-collapsed';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.link} ${styles.active}` : styles.link;

export function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const current = useMeetingStore((state) => state.currentMeeting);

  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1',
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const live = !!current?.realStartTime && !current?.realEndTime;

  return (
    <aside
      className={collapsed ? `${styles.sidebar} ${styles.collapsed}` : styles.sidebar}
    >
      <button
        className={styles.toggle}
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        title={collapsed ? 'Expand menu' : 'Collapse menu'}
      >
        {collapsed ? '»' : '«'}
      </button>

      <NavLink to={paths.home} className={styles.brand} aria-label="Timebox Works home">
        {collapsed ? (
          <span className={styles.brandIcon} aria-hidden="true">
            ⏳
          </span>
        ) : (
          <Logo />
        )}
      </NavLink>

      <nav className={styles.nav}>
        <NavLink to={paths.home} end className={linkClass} title="Home">
          <span className={styles.icon} aria-hidden="true">
            ⌂
          </span>
          <span className={styles.label}>Home</span>
        </NavLink>
        <NavLink to={paths.newMeeting} className={linkClass} title="New event">
          <span className={styles.icon} aria-hidden="true">
            ＋
          </span>
          <span className={styles.label}>New event</span>
        </NavLink>
        <NavLink to={paths.meetings} end className={linkClass} title="History">
          <span className={styles.icon} aria-hidden="true">
            🗂
          </span>
          <span className={styles.label}>History</span>
        </NavLink>
        {live && (
          <NavLink to={paths.liveMeeting} className={linkClass} title="Live event">
            <span className={styles.icon} aria-hidden="true">
              ⏱
            </span>
            <span className={styles.label}>Live event</span>
          </NavLink>
        )}
      </nav>

      <div className={styles.user}>
        {user?.photoURL && <img className={styles.avatar} src={user.photoURL} alt="" />}
        <span className={styles.name}>{user?.displayName ?? user?.email}</span>
        <button
          className={styles.signOut}
          onClick={() => void signOut()}
          title="Sign out"
          aria-label="Sign out"
        >
          <span className={styles.icon} aria-hidden="true">
            ⎋
          </span>
          <span className={styles.label}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
