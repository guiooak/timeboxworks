import type { ReactNode } from 'react';
import { Checkbox } from '../form';
import { cx } from '../cx';
import styles from './Collapse.module.css';

export type CollapseProps = {
  title: ReactNode;
  open: boolean;
  onToggleOpen: (open: boolean) => void;
  checkbox?: {
    label: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
  };
  children: ReactNode;
};

export function Collapse({
  title,
  open,
  onToggleOpen,
  checkbox,
  children,
}: CollapseProps) {
  return (
    <div className={cx(styles.collapse, open && styles.open)}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.titleButton}
          onClick={() => onToggleOpen(!open)}
        >
          <span className={styles.caret} aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          <span className={styles.title}>{title}</span>
        </button>
        {checkbox && (
          <span onClick={(event) => event.stopPropagation()}>
            <Checkbox
              label={checkbox.label}
              checked={checkbox.checked}
              disabled={checkbox.disabled}
              onChange={checkbox.onChange}
            />
          </span>
        )}
      </div>
      {open && <div className={styles.body}>{children}</div>}
    </div>
  );
}
