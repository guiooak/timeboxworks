import { useContext } from 'react';
import { DialogContext, type DialogApi } from './dialogContext';

export function useDialog(): DialogApi {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
