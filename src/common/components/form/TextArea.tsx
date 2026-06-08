import { useRef } from 'react';
import { cx } from '../cx';
import { useAutoGrowTextarea } from '../useAutoGrowTextarea';
import styles from './form.module.css';

export type TextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
  invalid?: boolean;
  onBlur?: () => void;
};

/** Textarea that grows to fit its content, so the full text is always visible
 * without a scrollbar. */
export function TextArea({
  value,
  onChange,
  name,
  id,
  placeholder,
  readOnly,
  minHeight = 80,
  invalid,
  onBlur,
}: TextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutoGrowTextarea(ref, value);

  return (
    <textarea
      ref={ref}
      id={id}
      name={name}
      className={cx(styles.control, styles.textarea, invalid && styles.invalid)}
      style={{ minHeight }}
      placeholder={placeholder}
      readOnly={readOnly}
      value={value}
      rows={1}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  );
}
