import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Col.module.css';

export type ColProps = { children: ReactNode; grow?: number; className?: string };

export function Col({ children, grow = 1, className }: ColProps) {
  return (
    <div className={cx(styles.col, className)} style={{ flexGrow: grow }}>
      {children}
    </div>
  );
}
