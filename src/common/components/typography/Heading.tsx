import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Heading.module.css';

export type HeadingSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type HeadingProps = {
  children?: ReactNode;
  title?: string;
  size?: HeadingSize;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
};

export function Heading({
  children,
  title,
  size = 'lg',
  level = 2,
  className,
}: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag className={cx(styles.heading, styles[size], className)}>{title ?? children}</Tag>
  );
}
