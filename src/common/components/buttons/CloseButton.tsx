import { cx } from '../cx';
import styles from './CloseButton.module.css';

export type CloseButtonProps = {
  onClick?: () => void;
  label?: string;
  className?: string;
};

export function CloseButton({ onClick, label = 'Close', className }: CloseButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cx(styles.close, className)}
      onClick={onClick}
    >
      &times;
    </button>
  );
}
