import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Animation.module.css';

export type AnimationProps = {
  children: ReactNode;
  type?: 'fade' | 'slide';
  className?: string;
};

export function Animation({ children, type = 'fade', className }: AnimationProps) {
  return <div className={cx(styles.animation, styles[type], className)}>{children}</div>;
}
