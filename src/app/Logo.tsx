import styles from './Logo.module.css';

export function Logo() {
  return (
    <span className={styles.logo}>
      <span className={styles.icon} aria-hidden="true">
        ⏳
      </span>
      Timebox <strong>Works</strong>
    </span>
  );
}
