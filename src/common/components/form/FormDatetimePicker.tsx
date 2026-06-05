import { DatePicker } from '../datepicker';
import styles from './form.module.css';

export type FormDatetimePickerProps = {
  value: string;
  onChange: (iso: string) => void;
  error?: string | null;
  onBlur?: () => void;
  id?: string;
};

export function FormDatetimePicker({
  value,
  onChange,
  error,
  onBlur,
  id,
}: FormDatetimePickerProps) {
  return (
    <>
      <DatePicker
        value={value}
        onChange={onChange}
        invalid={!!error}
        onBlur={onBlur}
        id={id}
      />
      {error && <span className={styles.error}>{error}</span>}
    </>
  );
}
