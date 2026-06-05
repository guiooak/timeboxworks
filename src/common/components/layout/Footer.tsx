import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Footer.module.css';

export type FooterProps = {
  children: ReactNode;
  justifyContent?: CSSProperties['justifyContent'];
  className?: string;
};

export function Footer({
  children,
  justifyContent = 'flex-end',
  className,
}: FooterProps) {
  return (
    <footer className={cx(styles.footer, className)} style={{ justifyContent }}>
      {children}
    </footer>
  );
}
