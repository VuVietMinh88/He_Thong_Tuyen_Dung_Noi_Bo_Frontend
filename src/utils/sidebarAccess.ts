export type SidebarMenuItem = {
  label: string;
  to: string;
  icon?: string;
  roles?: string[];
  permissions?: string[];
};

export const normalizeRole = (value?: string | null): string =>
  (value ?? "")
    .trim()
    .replace(/[-_\s]+/g, "_")
    .toLowerCase()
    .replace(/^role_/, "");

export const canAccessMenu = (
  allowedRoles: string[],
  currentRoles?: string[] | string | null,
): boolean => {
  if (!allowedRoles.length) {
    return true;
  }

  const normalizedUserRoles = Array.isArray(currentRoles)
    ? currentRoles.map(normalizeRole)
    : [normalizeRole(currentRoles)];

  return allowedRoles.some((role) =>
    normalizedUserRoles.includes(normalizeRole(role)),
  );
};

export const getVisibleMenuItems = (
  items: SidebarMenuItem[],
  currentRoles?: string[] | string | null,
  currentPermissions?: string[],
): SidebarMenuItem[] =>
  items.filter((item) =>
    (!item.roles || canAccessMenu(item.roles, currentRoles))
    && (!item.permissions?.length
      || item.permissions.some((permission) => currentPermissions?.includes(permission))),
  );
