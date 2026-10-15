import type {
  OnboardingCandidateTask,
  OnboardingProgressSummary,
  OnboardingTaskPhase,
} from '../types/onboardingChecklist';

/**
 * Kiểm tra xem một đầu việc có bị trễ hạn hay không (AC 2)
 */
export const isTaskOverdue = (
  task: OnboardingCandidateTask,
  referenceDateStr?: string
): boolean => {
  if (task.status === 'COMPLETED') return false;
  if (!task.deadline) return false;

  const todayStr = referenceDateStr || new Date().toISOString().split('T')[0];
  return task.deadline < todayStr;
};

/**
 * Tính toán tỷ lệ phần trăm và chỉ số hoàn thành onboarding (AC 1)
 */
export const calculateOnboardingProgress = (
  tasks: OnboardingCandidateTask[],
  referenceDateStr?: string
): OnboardingProgressSummary => {
  const todayStr = referenceDateStr || new Date().toISOString().split('T')[0];

  const phaseProgress: Record<
    OnboardingTaskPhase,
    { total: number; completed: number; percentage: number }
  > = {
    PRE_BOARDING: { total: 0, completed: 0, percentage: 0 },
    DAY_ONE: { total: 0, completed: 0, percentage: 0 },
    FIRST_WEEK: { total: 0, completed: 0, percentage: 0 },
    FIRST_MONTH: { total: 0, completed: 0, percentage: 0 },
  };

  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let overdue = 0;

  tasks.forEach((task) => {
    // Thống kê theo phase
    if (phaseProgress[task.phase]) {
      phaseProgress[task.phase].total += 1;
      if (task.status === 'COMPLETED') {
        phaseProgress[task.phase].completed += 1;
      }
    }

    // Thống kê trạng thái
    if (task.status === 'COMPLETED') {
      completed += 1;
    } else {
      if (task.deadline && task.deadline < todayStr) {
        overdue += 1;
      }

      if (task.status === 'IN_PROGRESS') {
        inProgress += 1;
      } else {
        notStarted += 1;
      }
    }
  });

  // Tính phần trăm từng giai đoạn
  Object.keys(phaseProgress).forEach((key) => {
    const p = phaseProgress[key as OnboardingTaskPhase];
    p.percentage = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
  });

  const total = tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    totalTasks: total,
    completedTasks: completed,
    inProgressTasks: inProgress,
    notStartedTasks: notStarted,
    overdueTasks: overdue,
    percentage,
    phaseProgress,
  };
};

/**
 * Trả về thông tin hạn chót kèm cảnh báo màu đỏ nếu trễ hạn (AC 2)
 */
export const getDeadlineDisplay = (
  deadlineStr: string,
  isCompleted: boolean,
  referenceDateStr?: string
): {
  formattedDate: string;
  badgeText: string;
  isOverdue: boolean;
  isToday: boolean;
  badgeClass: string;
} => {
  if (!deadlineStr) {
    return {
      formattedDate: 'Chưa đặt hạn chót',
      badgeText: 'Không có hạn',
      isOverdue: false,
      isToday: false,
      badgeClass: 'text-gray-400 bg-gray-50 border-gray-200',
    };
  }

  // Định dạng ngày hiển thị dd/mm/yyyy
  const parts = deadlineStr.split('-');
  const formattedDate =
    parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : deadlineStr;

  if (isCompleted) {
    return {
      formattedDate,
      badgeText: 'Đã hoàn thành',
      isOverdue: false,
      isToday: false,
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    };
  }

  const todayStr = referenceDateStr || new Date().toISOString().split('T')[0];

  if (deadlineStr < todayStr) {
    const deadlineTime = new Date(deadlineStr).getTime();
    const todayTime = new Date(todayStr).getTime();
    const diffDays = Math.max(1, Math.round((todayTime - deadlineTime) / (1000 * 60 * 60 * 24)));

    return {
      formattedDate,
      badgeText: `Quá hạn ${diffDays} ngày`,
      isOverdue: true,
      isToday: false,
      badgeClass: 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 font-bold',
    };
  }

  if (deadlineStr === todayStr) {
    return {
      formattedDate,
      badgeText: 'Hôm nay',
      isOverdue: false,
      isToday: true,
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 font-bold',
    };
  }

  const deadlineTime = new Date(deadlineStr).getTime();
  const todayTime = new Date(todayStr).getTime();
  const diffDays = Math.max(1, Math.round((deadlineTime - todayTime) / (1000 * 60 * 60 * 24)));

  return {
    formattedDate,
    badgeText: `Còn ${diffDays} ngày`,
    isOverdue: false,
    isToday: false,
    badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  };
};
