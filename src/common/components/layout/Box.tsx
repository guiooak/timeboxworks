import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Box.module.css';

export type BoxProps = { children: ReactNode; className?: string };

export function Box({ children, className }: BoxProps) {
  return <div className={cx(styles.box, className)}>{children}</div>;
}
