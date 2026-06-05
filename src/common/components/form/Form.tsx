import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useDialog } from '../overlay';
import { FormContext, type FieldRecord, type FormContextValue } from './formContext';

export type FormProps = {
  children: ReactNode;
  onSubmit?: (data: Record<string, unknown>) => void;
  onReset?: () => void;
  confirmReset?: boolean;
  className?: string;
};

function buildOutput(records: FieldRecord[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const record of records) {
    const value = record.getValue();
    if (record.groupKey) {
      const arr = (out[record.groupKey] as Array<Record<string, unknown>>) ?? [];
      out[record.groupKey] = arr;
      if (record.subGroupKey) {
        let obj = arr.find((item) => item.id === record.subGroupKey);
        if (!obj) {
          obj = { id: record.subGroupKey };
          arr.push(obj);
        }
        obj[record.name] = value;
      } else {
        arr.push({ [record.name]: value });
      }
    } else {
      out[record.name] = value;
    }
  }
  return out;
}

export function Form({
  children,
  onSubmit,
  onReset,
  confirmReset = true,
  className,
}: FormProps) {
  const dialog = useDialog();
  const recordsRef = useRef<Map<string, FieldRecord>>(new Map());
  const [submitCount, setSubmitCount] = useState(0);

  const register = useCallback((record: FieldRecord) => {
    recordsRef.current.set(record.id, record);
  }, []);
  const unregister = useCallback((id: string) => {
    recordsRef.current.delete(id);
  }, []);

  const context = useMemo<FormContextValue>(
    () => ({ register, unregister, submitCount }),
    [register, unregister, submitCount],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const records = Array.from(recordsRef.current.values());
    records.forEach((record) => record.markTouched());
    setSubmitCount((count) => count + 1);
    const valid = records.every((record) => record.isValid());
    if (valid) {
      onSubmit?.(buildOutput(records));
    }
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const confirmed =
      !confirmReset ||
      (await dialog.confirm({
        text: 'Are you sure you want to reset it at all?',
        confirmButtonTheme: 'danger',
        confirmButtonText: 'Yes, do it',
        cancelButtonText: 'Not anymore',
      }));
    if (confirmed) {
      onReset?.();
    }
  };

  return (
    <FormContext.Provider value={context}>
      <form
        className={className}
        onSubmit={handleSubmit}
        onReset={handleReset}
        noValidate
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}
