import { useRef } from 'react';
import { CloseButton } from '../buttons';
import { useAutoGrowTextarea } from '../useAutoGrowTextarea';
import styles from './PostIt.module.css';

export type PostItProps = {
  value: string;
  prefix?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onDelete?: () => void;
};

export function PostIt({ value, prefix, onChange, onBlur, onDelete }: PostItProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutoGrowTextarea(ref, value);

  return (
    <div className={styles.postIt}>
      <CloseButton className={styles.close} onClick={onDelete} label="Delete topic" />
      <div className={styles.row}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <textarea
          ref={ref}
          className={styles.textarea}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          rows={1}
        />
      </div>
    </div>
  );
}
