import type { ReactNode } from 'react';
import { Button, type ButtonSize } from '../buttons';
import type { Theme } from '../layout';

export type FormResetButtonProps = {
  children: ReactNode;
  theme?: Theme;
  size?: ButtonSize;
  className?: string;
};

export function FormResetButton({
  children,
  theme = 'secondary',
  size,
  className,
}: FormResetButtonProps) {
  return (
    <Button type="reset" theme={theme} size={size} outline className={className}>
      {children}
    </Button>
  );
}
