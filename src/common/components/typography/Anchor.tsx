import type { AnchorHTMLAttributes, ReactNode } from 'react';

export type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

export function Anchor({ children, ...rest }: AnchorProps) {
  return <a {...rest}>{children}</a>;
}
