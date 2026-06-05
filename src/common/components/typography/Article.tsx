import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Article.module.css';

export type ArticleProps = { children?: ReactNode; text?: string; className?: string };

export function Article({ children, text, className }: ArticleProps) {
  return <div className={cx(styles.article, className)}>{text ?? children}</div>;
}
