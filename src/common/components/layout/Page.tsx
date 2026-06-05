import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Page.module.css';

export type PageProps = { children: ReactNode; className?: string };

export function Page({ children, className }: PageProps) {
  return <section className={cx(styles.page, className)}>{children}</section>;
}
