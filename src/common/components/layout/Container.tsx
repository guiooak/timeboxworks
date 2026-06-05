import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Container.module.css';

export type ContainerProps = {
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
};

export function Container({ children, fullWidth, className }: ContainerProps) {
  return (
    <div className={cx(styles.container, fullWidth && styles.fullWidth, className)}>
      {children}
    </div>
  );
}
