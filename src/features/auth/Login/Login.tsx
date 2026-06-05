import { useState } from 'react';
import { Button, Heading, Paragraph } from '../../../common/components';
import { useAuthStore } from '../authStore';
import styles from './Login.module.css';

export function Login() {
  const signIn = useAuthStore((state) => state.signIn);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn();
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logo} aria-hidden="true">
          ⏳
        </div>
        <Heading size="md" level={1}>
          Timebox Works
        </Heading>
        <Paragraph className={styles.tagline}>
          Improve your meeting time with focus only on what matters.
        </Paragraph>
        <Button block onClick={onSignIn} disabled={busy}>
          {busy ? 'Signing in…' : 'Continue with Google'}
        </Button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
