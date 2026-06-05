import { createContext } from 'react';
import type { Theme } from '../layout';

export type AlertOptions = {
  title?: string;
  text: string;
  buttonText?: string;
  buttonTheme?: Theme;
  closeOnOverlayClick?: boolean;
};

export type ConfirmOptions = {
  title?: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonTheme?: Theme;
  disableCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
};

export type DialogApi = {
  alert: (options: AlertOptions | string) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

export const DialogContext = createContext<DialogApi | null>(null);
