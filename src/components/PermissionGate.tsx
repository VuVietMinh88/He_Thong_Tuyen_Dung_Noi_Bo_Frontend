import React, { cloneElement, isValidElement, type ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';
import { tokenService } from '../services/token.service';

interface PermissionGateProps {
  allowedRoles?: readonly string[];
  action?: string;
  resource?: string;
  children: ReactNode;
  fallback?: ReactNode;
  mode?: 'hidden' | 'disabled' | 'disable';
  className?: string;
  disabledClassName?: string;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  allowedRoles,
  action,
  resource,
  children,
  fallback = null,
  mode = 'hidden',
  className = '',
  disabledClassName = 'opacity-50 pointer-events-none',
}) => {
  const { hasPermission, can, isLoading } = usePermission();
  const roles = tokenService.getUserData()?.roles ?? [];

  const hasAccess =
    allowedRoles && allowedRoles.length > 0
      ? roles.some((role) => allowedRoles.includes(role.replace(/^ROLE_/, '')))
      : action && resource
        ? can(action, resource)
        : hasPermission(action ?? resource ?? '');

  if (isLoading) return null;
  if (!hasAccess) {
    if (mode === 'disabled' || mode === 'disable') {
      if (isValidElement(children)) {
        const element = children as React.ReactElement<any>;

        return cloneElement(element, {
          disabled: true,
          'aria-disabled': true,
          className: [element.props.className, className, disabledClassName]
            .filter(Boolean)
            .join(' '),
        });
      }

      return (
        <div className={className} aria-disabled="true">
          {fallback || children}
        </div>
      );
    }

    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
