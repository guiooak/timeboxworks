import { NavLink, paths } from '../common/services/router';
import { useAuthStore } from '../features/auth';
import { useMeetingStore } from '../features/meeting/store';
import { Logo } from './Logo';
import styles from './AppSidebar.module.css';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.link} ${styles.active}` : styles.link;

export function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const current = useMeetingStore((state) => state.currentMeeting);

  const live = !!current?.realStartTime && !current?.realEndTime;

  return (
    <aside className={styles.sidebar}>
      <NavLink to={paths.home} className={styles.brand}>
        <Logo />
      </NavLink>

      <nav className={styles.nav}>
        <NavLink to={paths.home} end className={linkClass}>
          <span aria-hidden="true">⌂</span> Home
        </NavLink>
        <NavLink to={paths.newMeeting} className={linkClass}>
          <span aria-hidden="true">＋</span> New event
        </NavLink>
        <NavLink to={paths.meetings} end className={linkClass}>
          <span aria-hidden="true">🗂</span> History
        </NavLink>
        {live && (
          <NavLink to={paths.liveMeeting} className={linkClass}>
            <span aria-hidden="true">⏱</span> Live event
          </NavLink>
        )}
      </nav>

      <div className={styles.user}>
        {user?.photoURL && <img className={styles.avatar} src={user.photoURL} alt="" />}
        <span className={styles.name}>{user?.displayName ?? user?.email}</span>
        <button className={styles.signOut} onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
