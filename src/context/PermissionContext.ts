import { createContext } from 'react';

export interface PermissionContextValue {
  permissions: string[];
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
}

export const PermissionContext = createContext<PermissionContextValue | null>(null);
