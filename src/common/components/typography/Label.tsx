import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Label.module.css';

export type LabelProps = {
  children?: ReactNode;
  text?: string;
  bold?: boolean;
  htmlFor?: string;
  className?: string;
};

export function Label({ children, text, bold, htmlFor, className }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={cx(styles.label, bold && styles.bold, className)}>
      {text ?? children}
    </label>
  );
}
