import { ChangeEvent, FormEvent } from 'react';

export interface TaskPageProps {
  children?: React.ReactNode;
}

export type TaskInputChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;