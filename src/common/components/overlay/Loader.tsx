import { cx } from '../cx';
import styles from './Loader.module.css';

export type LoaderProps = { label?: string; className?: string };

export function Loader({ label = 'Loading…', className }: LoaderProps) {
  return (
    <div className={cx(styles.loader, className)} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
