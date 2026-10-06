import React, { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { tokenService } from "../services/token.service";

type MenuItem = {
  label: string;
  to: string;
  icon: string;
  roles: string[];
};

const normalizeRole = (value?: string | null): string =>
  (value ?? "").trim().toLowerCase();

const menuItems: MenuItem[] = [
  {
    label: "Tổng quan",
    to: "/dashboard",
    icon: "⌂",
    roles: [
      "admin",
      "hr",
      "interviewer",
      "manager",
      "recruiter",
      "staff",
      "candidate",
    ],
  },
  {
    label: "Quản lý ứng viên",
    to: "/candidates",
    icon: "👥",
    roles: ["admin", "hr", "manager", "recruiter"],
  },
  {
    label: "Lịch phỏng vấn",
    to: "/interviews",
    icon: "📅",
    roles: ["admin", "hr", "interviewer", "manager"],
  },
  {
    label: "Pipeline tuyển dụng",
    to: "/pipeline",
    icon: "📈",
    roles: ["admin", "hr", "manager", "recruiter"],
  },
  {
    label: "Báo cáo",
    to: "/reports",
    icon: "📊",
    roles: ["admin", "hr", "manager"],
  },
  { label: "Quản trị người dùng", to: "/users", icon: "🛡️", roles: ["admin"] },
  {
    label: "Đổi mật khẩu",
    to: "/change-password",
    icon: "🔐",
    roles: [
      "admin",
      "hr",
      "interviewer",
      "manager",
      "recruiter",
      "staff",
      "candidate",
    ],
  },
];

const getDisplayName = (
  role?: string | null,
  email?: string | null,
): string => {
  if (email) {
    const localPart = email.split("@")[0]?.trim();
    if (localPart) return localPart;
  }

  switch (normalizeRole(role)) {
    case "admin":
      return "Quản trị viên";
    case "hr":
      return "HR";
    case "interviewer":
      return "Phỏng vấn";
    case "manager":
      return "Quản lý";
    case "recruiter":
      return "Recruiter";
    case "candidate":
      return "Ứng viên";
    default:
      return "Nhân sự";
  }
};

const canAccessMenu = (
  allowedRoles: string[],
  currentRole?: string | null,
): boolean => {
  if (!allowedRoles.length) return true;
  const role = normalizeRole(currentRole);
  return allowedRoles.some((item) => normalizeRole(item) === role);
};

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const user = tokenService.getUserData();
  const currentRole = normalizeRole(user?.role);

  const visibleMenu = useMemo(
    () => menuItems.filter((item) => canAccessMenu(item.roles, currentRole)),
    [currentRole],
  );

  const displayName = getDisplayName(user?.role, user?.email);
  const roleLabel = user?.role ? user.role.toUpperCase() : "USER";

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
