import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import type { Theme } from '../layout';
import styles from './Button.module.css';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  theme?: Theme;
  size?: ButtonSize;
  outline?: boolean;
  block?: boolean;
};

export function Button({
  children,
  theme = 'primary',
  size = 'md',
  outline,
  block,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        styles[theme],
        styles[size],
        outline && styles.outline,
        block && styles.block,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
