import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './form.module.css';

export type FormFieldProps = {
  label?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, htmlFor, children, className }: FormFieldProps) {
  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
