import React, { cloneElement, isValidElement, type ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';

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
  const { hasRole, can } = usePermission();

  const hasAccess =
    allowedRoles && allowedRoles.length > 0
      ? hasRole(allowedRoles)
      : action && resource
        ? can(action, resource)
        : true;

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
