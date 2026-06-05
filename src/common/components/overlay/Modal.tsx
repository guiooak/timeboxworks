import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '../buttons';
import { cx } from '../cx';
import styles from './Modal.module.css';

export type ModalProps = {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  disableCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
  disableCloseButton,
  closeOnOverlayClick,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !disableCloseButton) {
        onClose?.();
      }
    };
    document.addEventListener('keyup', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keyup', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, disableCloseButton]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlay}
      onClick={() => {
        if (closeOnOverlayClick) {
          onClose?.();
        }
      }}
    >
      <div
        className={styles.dialog}
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {(title || !disableCloseButton) && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            {!disableCloseButton && <CloseButton onClick={onClose} />}
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={cx(styles.footer)}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
