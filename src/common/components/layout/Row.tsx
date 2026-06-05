import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Row.module.css';

export type RowProps = { children: ReactNode; className?: string };

export function Row({ children, className }: RowProps) {
  return <div className={cx(styles.row, className)}>{children}</div>;
}
