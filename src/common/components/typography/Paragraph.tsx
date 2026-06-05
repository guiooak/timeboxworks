import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Paragraph.module.css';

export type ParagraphProps = { children?: ReactNode; text?: string; className?: string };

export function Paragraph({ children, text, className }: ParagraphProps) {
  return <p className={cx(styles.paragraph, className)}>{text ?? children}</p>;
}
