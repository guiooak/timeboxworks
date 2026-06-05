import { useContext, useEffect, useRef, useState } from 'react';
import { uid } from '../../services/uid';
import { FormContext } from './formContext';

export type FieldValidator = (value: string) => true | string;

export type UseFormFieldOptions = {
  name: string;
  initialValue?: string;
  /** Controlled override — when provided, the field is fully controlled and not registered. */
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  validate?: FieldValidator;
  groupKey?: string;
  subGroupKey?: string;
};

function computeError(value: string, options: UseFormFieldOptions): string | null {
  const trimmed = value?.trim?.() ?? '';
  if (options.required && !trimmed) {
    return 'This field is required';
  }
  if (options.minLength && value.length < options.minLength) {
    return `Use at least ${options.minLength} characters`;
  }
  if (options.maxLength && value.length > options.maxLength) {
    return `Use at most ${options.maxLength} characters`;
  }
  if (value && options.validate) {
    const result = options.validate(value);
    if (result !== true) {
      return result;
    }
  }
  return null;
}

export type UseFormFieldResult = {
  value: string;
  setValue: (value: string) => void;
  error: string | null;
  onBlur: () => void;
};

export function useFormField(options: UseFormFieldOptions): UseFormFieldResult {
  const form = useContext(FormContext);
  const controlled = options.value !== undefined;

  const [internal, setInternal] = useState(options.initialValue ?? '');
  const [touched, setTouched] = useState(false);
  const idRef = useRef<string>(uid());

  const value = controlled ? (options.value as string) : internal;

  const optionsRef = useRef(options);
  optionsRef.current = options;
  const valueRef = useRef(value);
  valueRef.current = value;

  const setValue = (next: string) => {
    if (controlled) {
      optionsRef.current.onChange?.(next);
    } else {
      setInternal(next);
    }
  };

  useEffect(() => {
    if (!form || controlled) {
      return;
    }
    const id = idRef.current;
    form.register({
      id,
      name: optionsRef.current.name,
      groupKey: optionsRef.current.groupKey,
      subGroupKey: optionsRef.current.subGroupKey,
      getValue: () => valueRef.current,
      isValid: () => computeError(valueRef.current, optionsRef.current) === null,
      markTouched: () => setTouched(true),
    });
    return () => form.unregister(id);
  }, [form, controlled]);

  const error = computeError(value, options);
  const showError = (touched || (form?.submitCount ?? 0) > 0) && !!error;

  return {
    value,
    setValue,
    error: showError ? error : null,
    onBlur: () => setTouched(true),
  };
}
