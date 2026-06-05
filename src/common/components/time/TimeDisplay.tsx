import type { ReactNode } from 'react';
import { Card, type Theme } from '../layout';
import styles from './TimeDisplay.module.css';

export type TimeDisplayProps = {
  theme?: Theme;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function TimeDisplay({
  theme = 'light',
  header,
  footer,
  children,
}: TimeDisplayProps) {
  return (
    <Card theme={theme} className={styles.display}>
      <div className={styles.header}>{header}</div>
      <div className={styles.value}>{children}</div>
      <div className={styles.footer}>{footer}</div>
    </Card>
  );
}
