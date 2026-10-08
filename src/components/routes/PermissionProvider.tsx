import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { PermissionContext } from '../../context/PermissionContext';
import { permissionService } from '../../services/permission.service';
import { tokenService } from '../../services/token.service';

interface PermissionProviderProps {
  children: ReactNode;
}

const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const [permissionState, setPermissionState] = useState<{
    revision: number;
    permissions: string[];
    error: Error | null;
  }>({ revision: -1, permissions: [], error: null });
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    if (!tokenService.getAccessToken()) return undefined;

    permissionService.getCurrentPermissions()
      .then(({ permissions: currentPermissions }) => {
        if (isCurrent) {
          setPermissionState({ revision, permissions: currentPermissions, error: null });
        }
      })
      .catch((permissionError: unknown) => {
        if (isCurrent) {
          setPermissionState({
            revision,
            permissions: [],
            error: permissionError instanceof Error
              ? permissionError
              : new Error('Không thể xác minh quyền truy cập.'),
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [revision]);

  useEffect(() => {
    const refreshPermissions = () => reload();
    window.addEventListener('storage', refreshPermissions);
    window.addEventListener('auth:changed', refreshPermissions);
    window.addEventListener('focus', refreshPermissions);
    return () => {
      window.removeEventListener('storage', refreshPermissions);
      window.removeEventListener('auth:changed', refreshPermissions);
      window.removeEventListener('focus', refreshPermissions);
    };
  }, [reload]);

  const hasToken = Boolean(tokenService.getAccessToken());
  const isCurrentState = permissionState.revision === revision;
  return (
    <PermissionContext.Provider value={{
      permissions: hasToken && isCurrentState ? permissionState.permissions : [],
      isLoading: hasToken && !isCurrentState,
      error: hasToken && isCurrentState ? permissionState.error : null,
      reload,
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionProvider;
