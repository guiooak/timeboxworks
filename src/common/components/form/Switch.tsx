import styles from './form.module.css';

export type SwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export function Switch({ checked, disabled, onChange, label }: SwitchProps) {
  return (
    <label className={styles.switch} aria-label={label}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
    </label>
  );
}
