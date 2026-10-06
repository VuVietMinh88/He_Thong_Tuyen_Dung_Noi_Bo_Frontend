import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ROLES } from "../../constants/roles";
import { tokenService } from "../../services/token.service";
import {
  getVisibleMenuItems,
  normalizeRole,
  type SidebarMenuItem,
} from "../../utils/sidebarAccess";

const menuItems: SidebarMenuItem[] = [
  {
    label: "Tổng quan",
    to: "/dashboard",
    icon: "⌂",
    roles: [
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.RECRUITER,
      ROLES.HIRING_MANAGER,
      ROLES.INTERVIEWER,
      ROLES.APPROVER,
    ],
  },
  {
    label: "Quản lý ứng viên",
    to: "/candidates",
    icon: "👥",
    roles: [
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.RECRUITER,
      ROLES.HIRING_MANAGER,
    ],
  },
  {
    label: "Lịch phỏng vấn",
    to: "/interviews",
    icon: "📅",
    roles: [
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.INTERVIEWER,
      ROLES.HIRING_MANAGER,
    ],
  },
  {
    label: "Pipeline tuyển dụng",
    to: "/pipeline",
    icon: "📈",
    roles: [
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.RECRUITER,
      ROLES.HIRING_MANAGER,
    ],
  },
  {
    label: "Báo cáo",
    to: "/reports",
    icon: "📊",
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    label: "Quản trị người dùng",
    to: "/users",
    icon: "🛡️",
    roles: [ROLES.ADMIN],
  },
  {
    label: "Đổi mật khẩu",
    to: "/change-password",
    icon: "🔐",
    roles: [
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.RECRUITER,
      ROLES.HIRING_MANAGER,
      ROLES.INTERVIEWER,
      ROLES.APPROVER,
    ],
  },
];

const getDisplayName = (
  roles?: string[] | null,
  email?: string | null,
): string => {
  if (email) {
    const localPart = email.split("@")[0]?.trim();
    if (localPart) {
      return localPart;
    }
  }

  const firstRole = roles?.[0];
  switch (normalizeRole(firstRole)) {
    case normalizeRole(ROLES.ADMIN):
      return "Quản trị viên";
    case normalizeRole(ROLES.HR_MANAGER):
      return "HR Manager";
    case normalizeRole(ROLES.RECRUITER):
      return "Recruiter";
    case normalizeRole(ROLES.HIRING_MANAGER):
      return "Hiring Manager";
    case normalizeRole(ROLES.INTERVIEWER):
      return "Interviewer";
    case normalizeRole(ROLES.APPROVER):
      return "Approver";
    default:
      return "Nhân sự";
  }
};

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = tokenService.getUserData();
  const userRoles =
    user?.roles && user.roles.length > 0
      ? user.roles
      : user?.role
        ? [user.role]
        : [];
  const visibleMenu = getVisibleMenuItems(menuItems, userRoles);
  const displayName = getDisplayName(userRoles, user?.email);
  const roleLabel =
    userRoles.length > 0
      ? userRoles.map((role) => role.toUpperCase()).join(", ")
      : "USER";

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Smart Recruitment
            </p>
            <p className="text-[11px] text-slate-500">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg text-slate-700"
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </div>

      <aside
        className={[
          "h-full w-full border-r border-slate-200 bg-slate-50 transition-all duration-200",
          isOpen ? "block" : "hidden md:block",
          "md:w-72 md:min-w-[18rem]",
        ].join(" ")}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="border-b border-slate-200 bg-white px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {displayName}
                </p>
                <p className="truncate text-xs text-slate-500">{roleLabel}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {visibleMenu.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
                Không có menu nào được cấp quyền.
              </div>
            ) : (
              visibleMenu.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      "truncate",
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white hover:text-indigo-600",
                    ].join(" ")
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
