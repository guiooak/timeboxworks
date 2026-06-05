import styles from './form.module.css';

export type SlimCheckboxProps = {
  label?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export function SlimCheckbox({ label, value, disabled, onChange }: SlimCheckboxProps) {
  return (
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
