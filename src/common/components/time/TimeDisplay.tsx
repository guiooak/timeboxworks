import type { ReactNode } from 'react';
import { cx } from '../cx';
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
  // Owns its own pastel backgrounds (lighter than Card's solid themes).
  return (
    <Card className={cx(styles.display, styles[theme])}>
      <div className={styles.header}>{header}</div>
      <div className={styles.value}>{children}</div>
      <div className={styles.footer}>{footer}</div>
    </Card>
  );
}
