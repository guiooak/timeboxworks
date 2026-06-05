import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Card.module.css';

export type Theme =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'light'
  | 'dark';

export type CardProps = {
  children: ReactNode;
  theme?: Theme;
  className?: string;
};

export function Card({ children, theme = 'light', className }: CardProps) {
  return <div className={cx(styles.card, styles[theme], className)}>{children}</div>;
}
