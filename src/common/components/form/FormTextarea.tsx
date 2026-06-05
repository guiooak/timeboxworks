import { cx } from '../cx';
import { useFormField, type FieldValidator } from './useFormField';
import styles from './form.module.css';

export type FormTextareaProps = {
  name: string;
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minHeight?: number;
  readOnly?: boolean;
  validate?: FieldValidator;
  id?: string;
};

export function FormTextarea({
  placeholder,
  minHeight = 80,
  readOnly,
  id,
  ...fieldOptions
}: FormTextareaProps) {
  const { value, setValue, error, onBlur } = useFormField(fieldOptions);
  return (
    <>
      <textarea
        id={id}
        name={fieldOptions.name}
        className={cx(styles.control, styles.textarea, error && styles.invalid)}
        style={{ minHeight }}
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={onBlur}
      />
      {error && <span className={styles.error}>{error}</span>}
    </>
  );
}
