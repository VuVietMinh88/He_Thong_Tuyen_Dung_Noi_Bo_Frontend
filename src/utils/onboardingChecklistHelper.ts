import type {
  OnboardingChecklistItem,
  OnboardingTaskPhase,
  OnboardingResponsibleRole,
  ChecklistItemValidationErrors,
  ChecklistTemplateStats,
} from '../types/onboardingChecklist';
import { ONBOARDING_PHASES, ONBOARDING_ROLES } from '../types/onboardingChecklist';

/**
 * Validate tính hợp lệ của một đầu việc mẫu checklist (AC 2)
 */
export const validateChecklistItem = (
  item: Partial<OnboardingChecklistItem>
): { isValid: boolean; errors: ChecklistItemValidationErrors } => {
  const errors: ChecklistItemValidationErrors = {};

  // 1. Kiểm tra tiêu đề đầu việc (Task Title)
  if (!item.title || !item.title.trim()) {
    errors.title = 'Vui lòng nhập tên công việc hoặc tiêu đề đầu việc';
  } else if (item.title.trim().length < 3) {
    errors.title = 'Tên công việc phải có ít nhất 3 ký tự';
  } else if (item.title.trim().length > 255) {
    errors.title = 'Tên công việc không được vượt quá 255 ký tự';
  }

  // 2. Kiểm tra thời hạn hoàn thành (SLA Due Days)
  if (item.dueDays === undefined || item.dueDays === null || isNaN(Number(item.dueDays))) {
    errors.dueDays = 'Vui lòng nhập thời hạn hoàn thành (SLA)';
  } else {
    const days = Number(item.dueDays);
    if (!Number.isInteger(days) || days <= 0) {
      errors.dueDays = 'Thời hạn SLA phải là số nguyên dương (>= 1 ngày)';
    } else if (days > 180) {
      errors.dueDays = 'Thời hạn SLA tối đa không vượt quá 180 ngày';
    }
  }

  // 3. Kiểm tra vai trò phụ trách
  const validRoles: OnboardingResponsibleRole[] = ['HR', 'DIRECT_MANAGER', 'IT_SUPPORT', 'NEW_HIRE'];
  if (!item.responsibleRole || !validRoles.includes(item.responsibleRole)) {
    errors.responsibleRole = 'Vui lòng chọn vai trò phụ trách mặc định';
  }

  // 4. Kiểm tra nhóm nhiệm vụ (Giai đoạn)
  const validPhases: OnboardingTaskPhase[] = ['PRE_BOARDING', 'DAY_ONE', 'FIRST_WEEK', 'FIRST_MONTH'];
  if (!item.phase || !validPhases.includes(item.phase)) {
    errors.phase = 'Vui lòng chọn nhóm nhiệm vụ / giai đoạn thực hiện';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Lấy cấu hình hiển thị của nhóm nhiệm vụ (Giai đoạn tiếp nhận)
 */
export const getPhaseConfig = (phase: OnboardingTaskPhase) => {
  const found = ONBOARDING_PHASES.find((p) => p.id === phase);
  return (
    found || {
      id: phase,
      label: phase,
      shortLabel: phase,
      description: '',
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
      borderClass: 'border-l-gray-400',
    }
  );
};

/**
 * Lấy cấu hình hiển thị vai trò người phụ trách
 */
export const getRoleConfig = (role: OnboardingResponsibleRole) => {
  const found = ONBOARDING_ROLES.find((r) => r.id === role);
  return (
    found || {
      id: role,
      label: role,
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
      iconName: 'User',
    }
  );
};

/**
 * Tính toán thống kê tổng quan cho mẫu checklist phòng ban (AC 1)
 */
export const calculateTemplateStats = (
  items: OnboardingChecklistItem[]
): ChecklistTemplateStats => {
  const phaseDist: Record<OnboardingTaskPhase, number> = {
    PRE_BOARDING: 0,
    DAY_ONE: 0,
    FIRST_WEEK: 0,
    FIRST_MONTH: 0,
  };

  const roleDist: Record<OnboardingResponsibleRole, number> = {
    HR: 0,
    DIRECT_MANAGER: 0,
    IT_SUPPORT: 0,
    NEW_HIRE: 0,
  };

  let maxDays = 0;
  let active = 0;
  let required = 0;

  items.forEach((item) => {
    if (item.isActive) active += 1;
    if (item.isRequired) required += 1;
    if (item.dueDays > maxDays) maxDays = item.dueDays;

    if (phaseDist[item.phase] !== undefined) {
      phaseDist[item.phase] += 1;
    }
    if (roleDist[item.responsibleRole] !== undefined) {
      roleDist[item.responsibleRole] += 1;
    }
  });

  return {
    totalItems: items.length,
    activeItems: active,
    inactiveItems: items.length - active,
    requiredItems: required,
    maxSlaDays: maxDays,
    phaseDistribution: phaseDist,
    roleDistribution: roleDist,
  };
};

/**
 * Di chuyển thứ tự đầu việc lên trên hoặc xuống dưới (AC 3)
 */
export const moveChecklistItem = (
  items: OnboardingChecklistItem[],
  itemId: string,
  direction: 'UP' | 'DOWN'
): OnboardingChecklistItem[] => {
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) return items;

  if (direction === 'UP' && index === 0) return items;
  if (direction === 'DOWN' && index === items.length - 1) return items;

  const targetIndex = direction === 'UP' ? index - 1 : index + 1;
  const newItems = [...items];
  const [removed] = newItems.splice(index, 1);
  newItems.splice(targetIndex, 0, removed);

  return newItems.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));
};

/**
 * Đổi chỗ thứ tự kéo thả (Drag and Drop reorder)
 */
export const reorderChecklistItems = (
  items: OnboardingChecklistItem[],
  startIndex: number,
  endIndex: number
): OnboardingChecklistItem[] => {
  if (startIndex === endIndex) return items;
  if (startIndex < 0 || startIndex >= items.length) return items;
  if (endIndex < 0 || endIndex >= items.length) return items;

  const result = Array.from(items);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
};
