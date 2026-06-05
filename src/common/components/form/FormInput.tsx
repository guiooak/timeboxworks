import { cx } from '../cx';
import { useFormField, type FieldValidator } from './useFormField';
import styles from './form.module.css';

export type FormInputProps = {
  name: string;
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  validate?: FieldValidator;
  groupKey?: string;
  subGroupKey?: string;
  id?: string;
  className?: string;
};

export function FormInput({
  type = 'text',
  placeholder,
  id,
  className,
  ...fieldOptions
}: FormInputProps) {
  const { value, setValue, error, onBlur } = useFormField(fieldOptions);
  return (
    <>
      <input
        id={id}
        name={fieldOptions.name}
        type={type}
        className={cx(styles.control, error && styles.invalid, className)}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={onBlur}
      />
      {error && <span className={styles.error}>{error}</span>}
    </>
  );
}
