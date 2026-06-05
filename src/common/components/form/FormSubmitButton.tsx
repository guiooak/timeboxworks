import type { ReactNode } from 'react';
import { Button, type ButtonSize } from '../buttons';
import type { Theme } from '../layout';

export type FormSubmitButtonProps = {
  children: ReactNode;
  theme?: Theme;
  size?: ButtonSize;
  className?: string;
};

export function FormSubmitButton({
  children,
  theme = 'primary',
  size,
  className,
}: FormSubmitButtonProps) {
  return (
    <Button type="submit" theme={theme} size={size} className={className}>
      {children}
    </Button>
  );
}
