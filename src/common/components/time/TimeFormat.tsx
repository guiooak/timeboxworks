import { cx } from '../cx';
import styles from './TimeFormat.module.css';

export type TimeFormatSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TimeFormatProps = {
  value: string;
  size?: TimeFormatSize;
  className?: string;
};

export function TimeFormat({ value, size = 'md', className }: TimeFormatProps) {
  return <span className={cx(styles.time, styles[size], className)}>{value}</span>;
}
