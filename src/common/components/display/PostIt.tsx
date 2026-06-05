import type { Ref } from 'react';
import { CloseButton } from '../buttons';
import styles from './PostIt.module.css';

export type PostItProps = {
  value: string;
  prefix?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onDelete?: () => void;
  textareaRef?: Ref<HTMLTextAreaElement>;
};

export function PostIt({
  value,
  prefix,
  onChange,
  onBlur,
  onDelete,
  textareaRef,
}: PostItProps) {
  return (
    <div className={styles.postIt}>
      <div className={styles.top}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <CloseButton onClick={onDelete} label="Delete topic" />
      </div>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        rows={2}
      />
    </div>
  );
}
