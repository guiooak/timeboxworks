import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Button } from '../buttons';
import { uid } from '../../services/uid';
import { Modal } from './Modal';
import {
  DialogContext,
  type AlertOptions,
  type ConfirmOptions,
  type DialogApi,
} from './dialogContext';

type DialogItem =
  | { id: string; kind: 'alert'; options: AlertOptions; resolve: () => void }
  | {
      id: string;
      kind: 'confirm';
      options: ConfirmOptions;
      resolve: (value: boolean) => void;
    };

export function DialogProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<DialogItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
      alert: (options) =>
        new Promise<void>((resolve) => {
          const normalized: AlertOptions =
            typeof options === 'string' ? { text: options } : options;
          setItems((current) => [
            ...current,
            { id: uid(), kind: 'alert', options: normalized, resolve },
          ]);
        }),
      confirm: (options) =>
        new Promise<boolean>((resolve) => {
          setItems((current) => [
            ...current,
            { id: uid(), kind: 'confirm', options, resolve },
          ]);
        }),
    }),
    [],
  );

  return (
    <DialogContext.Provider value={api}>
      {children}
      {items.map((item) => {
        const settle = (value: boolean) => {
          remove(item.id);
          if (item.kind === 'confirm') {
            item.resolve(value);
          } else {
            item.resolve();
          }
        };
        if (item.kind === 'alert') {
          const { title, text, buttonText, buttonTheme, closeOnOverlayClick } =
            item.options;
          return (
            <Modal
              key={item.id}
              open
              title={title}
              onClose={() => settle(true)}
              closeOnOverlayClick={closeOnOverlayClick}
              footer={
                <Button theme={buttonTheme ?? 'primary'} onClick={() => settle(true)}>
                  {buttonText ?? 'OK'}
                </Button>
              }
            >
              <p>{text}</p>
            </Modal>
          );
        }
        const {
          title,
          text,
          confirmButtonText,
          cancelButtonText,
          confirmButtonTheme,
          disableCloseButton,
          closeOnOverlayClick,
        } = item.options;
        return (
          <Modal
            key={item.id}
            open
            title={title}
            onClose={() => settle(false)}
            disableCloseButton={disableCloseButton}
            closeOnOverlayClick={closeOnOverlayClick}
            footer={
              <>
                <Button theme="secondary" outline onClick={() => settle(false)}>
                  {cancelButtonText ?? 'Cancel'}
                </Button>
                <Button
                  theme={confirmButtonTheme ?? 'primary'}
                  onClick={() => settle(true)}
                >
                  {confirmButtonText ?? 'Confirm'}
                </Button>
              </>
            }
          >
            <p>{text}</p>
          </Modal>
        );
      })}
    </DialogContext.Provider>
  );
}
