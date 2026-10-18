import type { PreviewRow } from "../../services/import.service";

export type StatusFilterOption = "ALL" | "VALID" | "INVALID" | "DUPLICATE";

export interface ImportColumnFilters {
  rowNumber: string;
  fullName: string;
  email: string;
  phone: string;
  roles: string;
  departmentCode: string;
  displayTitle: string;
  status: StatusFilterOption;
}

export const INITIAL_COLUMN_FILTERS: ImportColumnFilters = {
  rowNumber: "",
  fullName: "",
  email: "",
  phone: "",
  roles: "",
  departmentCode: "",
  displayTitle: "",
  status: "ALL",
};

/**
 * Kiểm tra xem một dòng xem trước có bị trùng thông tin hay không:
 * 1. Chứa thông báo lỗi trùng dữ liệu (trùng, duplicate, đã tồn tại...)
 * 2. Trùng email với ít nhất một dòng khác trong file
 * 3. Trùng số điện thoại với ít nhất một dòng khác trong file
 * 4. Trùng họ và tên với ít nhất một dòng khác trong file
 */
export const isRowDuplicate = (
  row: PreviewRow,
  allRows: PreviewRow[],
): boolean => {
  // 1. Lỗi từ phía API Backend báo trùng
  const hasDuplicateError = row.errors?.some((e) =>
    /trùng|duplicate|đã tồn tại|đã được/i.test(e.message),
  );
  if (hasDuplicateError) return true;

  // 2. Trùng email với dòng khác
  const currentEmail = row.email?.trim().toLowerCase();
  if (
    currentEmail &&
    allRows.filter(
      (r) => r.email && r.email.trim().toLowerCase() === currentEmail,
    ).length > 1
  ) {
    return true;
  }

  // 3. Trùng số điện thoại với dòng khác
  const currentPhone = row.phone?.trim().replace(/\s+/g, "");
  if (
    currentPhone &&
    allRows.filter(
      (r) => r.phone && r.phone.trim().replace(/\s+/g, "") === currentPhone,
    ).length > 1
  ) {
    return true;
  }

  // 4. Trùng họ tên với dòng khác
  const currentFullName = row.fullName?.trim().toLowerCase();
  if (
    currentFullName &&
    allRows.filter(
      (r) =>
        r.fullName && r.fullName.trim().toLowerCase() === currentFullName,
    ).length > 1
  ) {
    return true;
  }

  return false;
};
