export type SidebarMenuItem = {
  label: string;
  to: string;
  icon?: string;
  roles: string[];
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
): SidebarMenuItem[] =>
  items.filter((item) => canAccessMenu(item.roles, currentRoles));
