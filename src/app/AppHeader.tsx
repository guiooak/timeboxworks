import { Container } from '../common/components';
import { useNavigation } from '../common/services/router';
import { useAuthStore } from '../features/auth';
import { Logo } from './Logo';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const signOut = useAuthStore((state) => state.signOut);
  const navigation = useNavigation();

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <button className={styles.brand} onClick={() => navigation.go('/meeting/form')}>
          <Logo />
        </button>
        {status === 'authenticated' && (
          <nav className={styles.user}>
            <button className={styles.link} onClick={() => navigation.go('/meetings')}>
              My meetings
            </button>
            {user?.photoURL && (
              <img className={styles.avatar} src={user.photoURL} alt="" />
            )}
            <span className={styles.name}>{user?.displayName ?? user?.email}</span>
            <button className={styles.link} onClick={() => void signOut()}>
              Sign out
            </button>
          </nav>
        )}
      </Container>
    </header>
  );
}
