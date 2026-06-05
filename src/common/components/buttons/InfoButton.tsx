import type { ReactNode } from 'react';
import styles from './InfoButton.module.css';

export type InfoButtonProps = {
  children?: ReactNode;
  onClick?: () => void;
  label?: string;
};

export function InfoButton({ children, onClick, label = 'More info' }: InfoButtonProps) {
  return (
    <button type="button" aria-label={label} className={styles.info} onClick={onClick}>
      {children ?? 'i'}
    </button>
  );
}
