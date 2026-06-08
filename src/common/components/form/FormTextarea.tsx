import { TextArea } from './TextArea';
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
  minHeight,
  readOnly,
  id,
  ...fieldOptions
}: FormTextareaProps) {
  const { value, setValue, error, onBlur } = useFormField(fieldOptions);
  return (
    <>
      <TextArea
        id={id}
        name={fieldOptions.name}
        value={value}
        onChange={setValue}
        onBlur={onBlur}
        placeholder={placeholder}
        readOnly={readOnly}
        minHeight={minHeight}
        invalid={!!error}
      />
      {error && <span className={styles.error}>{error}</span>}
    </>
  );
}
