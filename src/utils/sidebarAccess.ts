export type SidebarMenuItem = {
  label: string;
  to: string;
  icon?: string;
  roles?: string[];
  permissions?: string[];
  group?: string;
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
  items.filter((item) => {
    // 1. Kiểm tra vai trò (Role)
    if (item.roles && !canAccessMenu(item.roles, currentRoles)) {
      return false;
    }

    // 2. Nếu item không yêu cầu permission cụ thể -> Luôn hiển thị
    if (!item.permissions?.length) {
      return true;
    }

    // 3. Nếu chưa nạp được quyền từ server (rỗng do lỗi mạng / offline) -> Hiển thị theo role để không mất chức năng
    if (!currentPermissions || currentPermissions.length === 0) {
      return true;
    }

    // 4. Nếu có danh sách quyền thực tế từ máy chủ -> Kiểm tra mã quyền chi tiết
    return item.permissions.some((permission) =>
      currentPermissions.includes(permission),
    );
  });
