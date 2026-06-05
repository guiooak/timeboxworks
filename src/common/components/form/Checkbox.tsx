import styles from './form.module.css';

export type CheckboxProps = {
  label?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
};

export function Checkbox({ label, checked, disabled, onChange, id }: CheckboxProps) {
  return (
    <label className={styles.check}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
