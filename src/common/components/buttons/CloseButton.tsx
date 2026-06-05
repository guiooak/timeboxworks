import styles from './CloseButton.module.css';

export type CloseButtonProps = { onClick?: () => void; label?: string };

export function CloseButton({ onClick, label = 'Close' }: CloseButtonProps) {
  return (
    <button type="button" aria-label={label} className={styles.close} onClick={onClick}>
      &times;
    </button>
  );
}
