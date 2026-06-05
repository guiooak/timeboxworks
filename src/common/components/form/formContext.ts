import { createContext } from 'react';

export type FieldRecord = {
  id: string;
  name: string;
  groupKey?: string;
  subGroupKey?: string;
  getValue: () => string;
  isValid: () => boolean;
  markTouched: () => void;
};

export type FormContextValue = {
  register: (record: FieldRecord) => void;
  unregister: (id: string) => void;
  submitCount: number;
};

export const FormContext = createContext<FormContextValue | null>(null);
