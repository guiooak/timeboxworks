import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './List.module.css';

export type ListProps = { children: ReactNode; showMarks?: boolean; className?: string };

export function List({ children, showMarks, className }: ListProps) {
  return (
    <ul className={cx(styles.list, showMarks && styles.marks, className)}>{children}</ul>
  );
}
