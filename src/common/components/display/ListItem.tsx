import type { ReactNode } from 'react';
import styles from './ListItem.module.css';

export type ListItemProps = { children: ReactNode };

export function ListItem({ children }: ListItemProps) {
  return <li className={styles.item}>{children}</li>;
}
