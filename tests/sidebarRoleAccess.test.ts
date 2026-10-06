import { describe, expect, it } from "vitest";

import { ROLES } from "../src/constants/roles";
import {
  canAccessMenu,
  getVisibleMenuItems,
  normalizeRole,
} from "../src/utils/sidebarAccess";

describe("sidebar role access", () => {
  it("normalizes backend role strings consistently", () => {
    expect(normalizeRole("HR_MANAGER")).toBe("hr_manager");
    expect(normalizeRole("hr_manager")).toBe("hr_manager");
    expect(normalizeRole("  hr_manager  ")).toBe("hr_manager");
  });

  it("checks menu access using backend roles array", () => {
    expect(canAccessMenu([ROLES.ADMIN], ROLES.ADMIN)).toBe(true);
    expect(canAccessMenu([ROLES.ADMIN], ROLES.HR_MANAGER)).toBe(false);
    expect(
      canAccessMenu([ROLES.RECRUITER, ROLES.HR_MANAGER], ROLES.RECRUITER),
    ).toBe(true);
  });

  it("filters menu items by the user's roles array", () => {
    const items = [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: "⌂",
        roles: [ROLES.ADMIN, ROLES.HR_MANAGER],
      },
      {
        label: "Candidates",
        to: "/candidates",
        icon: "👥",
        roles: [ROLES.RECRUITER],
      },
    ];

    expect(getVisibleMenuItems(items, [ROLES.HR_MANAGER])).toHaveLength(1);
    expect(getVisibleMenuItems(items, [ROLES.RECRUITER])).toHaveLength(1);
    expect(getVisibleMenuItems(items, [ROLES.APPROVER])).toHaveLength(0);
  });
});
