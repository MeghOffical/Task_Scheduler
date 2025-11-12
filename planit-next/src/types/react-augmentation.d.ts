import type { ReactNode } from 'react';

declare module 'react' {
  export type FormEvent<T = Element> = Event & {
    target: T;
    preventDefault(): void;
  };

  export type ChangeEvent<T = Element> = Event & {
    target: T;
    preventDefault(): void;
  };

  export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // extend if needed
  }

  export interface DOMAttributes<T> {
    children?: ReactNode;
    // extend if needed
  }

  export interface AriaAttributes {
    // extend if needed
  }
}