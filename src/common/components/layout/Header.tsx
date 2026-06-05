import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Header.module.css';

export type HeaderProps = { children: ReactNode; className?: string };

export function Header({ children, className }: HeaderProps) {
  return <header className={cx(styles.header, className)}>{children}</header>;
}
