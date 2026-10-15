import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { OnboardingTrackingBoard } from '../src/components/Onboarding/OnboardingTrackingBoard';
import { QuickTaskCompletionModal } from '../src/components/Onboarding/QuickTaskCompletionModal';
import { ToastProvider } from '../src/components/notifications/ToastProvider';
import { onboardingService } from '../src/services/onboardingService';
import {
  canUserUpdateTask,
} from '../src/utils/onboardingTrackingHelper';
import type {
  OnboardingCandidateTask,
  CandidateOnboardingRecord,
  UserPermissionContext,
} from '../src/types/onboardingChecklist';

describe('Jira Task TKNHTTDNB1-519: Tích hợp cập nhật checklist tiếp nhận (User Story S8-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockTasks: OnboardingCandidateTask[] = [
    {
      id: 'task-it-01',
      title: 'Bàn giao máy tính laptop và thiết lập tài khoản nội bộ',
      description: 'Cấp laptop cấu hình Core i7, 32GB RAM và cài đặt môi trường',
      phase: 'PRE_BOARDING',
      responsibleRole: 'IT_SUPPORT',
      assigneeName: 'Đặng Quốc Huy (IT Admin)',
      deadline: '2026-10-14',
      status: 'NOT_STARTED',
      isRequired: true,
      category: 'Thiết bị & Tài khoản',
      order: 1,
    },
    {
      id: 'task-hr-02',
      title: 'Ký Hợp đồng lao động thử việc và nhận hồ sơ nhân sự gốc',
      description: 'Ký kết hợp đồng 2 tháng thử việc, nộp hồ sơ bằng cấp công chứng',
      phase: 'DAY_ONE',
      responsibleRole: 'HR',
      assigneeName: 'Trần Thị Thu (HR Generalist)',
      deadline: '2026-10-15',
      status: 'IN_PROGRESS',
      isRequired: true,
      category: 'Thủ tục nhân sự',
      order: 2,
    },
    {
      id: 'task-self-03',
      title: 'Tham gia buổi đào tạo Văn hóa doanh nghiệp & An toàn thông tin',
      description: 'Học e-learning và hoàn thành bài kiểm tra trắc nghiệm',
      phase: 'DAY_ONE',
      responsibleRole: 'NEW_HIRE',
      assigneeName: 'Nguyễn Văn An (Bản thân nhân sự)',
      deadline: '2026-10-16',
      status: 'NOT_STARTED',
      isRequired: true,
      category: 'Hội nhập',
      order: 3,
    },
    {
      id: 'task-mgr-04',
      title: 'Thiết lập mục tiêu KPI 30 ngày đầu cùng Quản lý trực tiếp',
      description: 'Thống nhất 3 kết quả then chốt (OKRs) cho tháng đầu tiên',
      phase: 'FIRST_WEEK',
      responsibleRole: 'DIRECT_MANAGER',
      assigneeName: 'Vũ Đức Đam (Tech Lead)',
      deadline: '2026-10-20',
      status: 'NOT_STARTED',
      isRequired: true,
      category: 'Đánh giá & Mục tiêu',
      order: 4,
    },
  ];

  const mockCandidateRecord: CandidateOnboardingRecord = {
    id: 'ONB-TEST-519',
    candidateId: 'cand-519',
    candidateName: 'Nguyễn Văn An',
    candidateCode: 'EMP-2026-0891',
    candidateEmail: 'an.nguyen@smartrecruit.vn',
    jobTitle: 'Senior Frontend Developer',
    departmentId: 'dept-it',
    departmentName: 'Phòng Công Nghệ Thông Tin (IT)',
    startDate: '2026-10-15',
    managerName: 'Vũ Đức Đam (Tech Lead)',
    hrInCharge: 'Trần Thị Thu (HR Generalist)',
    tasks: mockTasks,
    createdAt: '2026-10-10T08:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z',
  };

  /* =========================================================================
   * 1. AC 2: Xác thực quyền hạn (Permission Validation)
   * ========================================================================= */
  describe('AC 2: Xác thực quyền hạn thao tác trên đầu việc (canUserUpdateTask)', () => {
    it('cho phép Quản trị viên HR toàn quyền thao tác trên mọi đầu việc', () => {
      const hrUser: UserPermissionContext = {
        id: 'usr-hr-01',
        email: 'hr.manager@smartrecruit.vn',
        fullName: 'Trần Thị Thu',
        roles: ['HR_MANAGER', 'ADMIN'],
      };

      // HR có quyền trên đầu việc IT
      const itTaskResult = canUserUpdateTask(mockTasks[0], hrUser, mockCandidateRecord);
      expect(itTaskResult.canUpdate).toBe(true);

      // HR có quyền trên đầu việc của Manager
      const mgrTaskResult = canUserUpdateTask(mockTasks[3], hrUser, mockCandidateRecord);
      expect(mgrTaskResult.canUpdate).toBe(true);
    });

    it('cho phép IT Support chỉ cập nhật đầu việc thuộc trách nhiệm của bộ phận CNTT', () => {
      const itUser: UserPermissionContext = {
        id: 'usr-it-01',
        email: 'huy.dang@smartrecruit.vn',
        fullName: 'Đặng Quốc Huy (IT Admin)',
        roles: ['IT_SUPPORT'],
      };

      // Được phép thao tác task IT
      const itResult = canUserUpdateTask(mockTasks[0], itUser, mockCandidateRecord);
      expect(itResult.canUpdate).toBe(true);

      // Bị chặn thao tác task HR
      const hrResult = canUserUpdateTask(mockTasks[1], itUser, mockCandidateRecord);
      expect(hrResult.canUpdate).toBe(false);
      expect(hrResult.reason).toContain('Bạn không có quyền thao tác trên đầu việc của Phòng Nhân sự (HR)');
    });

    it('cho phép nhân sự mới tự cập nhật đầu việc tự học hội nhập của bản thân', () => {
      const newHireUser: UserPermissionContext = {
        id: 'cand-519',
        email: 'an.nguyen@smartrecruit.vn',
        fullName: 'Nguyễn Văn An',
        roles: ['NEW_HIRE'],
      };

      // Tự hoàn thành task cá nhân
      const selfResult = canUserUpdateTask(mockTasks[2], newHireUser, mockCandidateRecord);
      expect(selfResult.canUpdate).toBe(true);

      // Không thể tự duyệt ký hợp đồng lao động thay HR
      const hrResult = canUserUpdateTask(mockTasks[1], newHireUser, mockCandidateRecord);
      expect(hrResult.canUpdate).toBe(false);
    });

    it('ngăn chặn người dùng từ bộ phận khác và trả về thông báo lỗi rõ ràng', () => {
      const otherUser: UserPermissionContext = {
        id: 'usr-other-01',
        email: 'other.employee@smartrecruit.vn',
        fullName: 'Lê Văn Khác',
        roles: ['ACCOUNTANT'],
      };

      const result = canUserUpdateTask(mockTasks[0], otherUser, mockCandidateRecord);
      expect(result.canUpdate).toBe(false);
      expect(result.reason).toContain('Bạn không có quyền thao tác trên đầu việc của Bộ phận IT');
      expect(result.reason).toContain('Đặng Quốc Huy (IT Admin)');
    });
  });

  /* =========================================================================
   * 2. AC 1: Tương tác cập nhật trạng thái & Ghi chú nhanh (Quick Completion Modal)
   * ========================================================================= */
  describe('AC 1: Modal ghi chú nhanh khi hoàn thành (QuickTaskCompletionModal)', () => {
    it('render modal nhập ghi chú khi hoàn thành với các gợi ý thực tế', () => {
      const targetTask = mockTasks[0];

      const html = renderToString(
        <QuickTaskCompletionModal
          isOpen={true}
          task={targetTask}
          onClose={() => {}}
          onConfirm={async () => {}}
        />
      );

      expect(html).toContain('data-testid="quick-task-completion-modal"');
      expect(html).toContain('Xác nhận hoàn thành nhiệm vụ');
      expect(html).toContain(targetTask.title);

      // Input ghi chú
      expect(html).toContain('data-testid="input-quick-completion-notes"');

      // Gợi ý ghi chú nhanh (AC 1)
      expect(html).toContain('Đã bàn giao laptop Dell Latitude mã số LT-042');
      expect(html).toContain('Đã cấp tài khoản Google Workspace và GitLab');

      // Nút thao tác
      expect(html).toContain('data-testid="btn-confirm-completion"');
      expect(html).toContain('data-testid="btn-skip-notes"');
      expect(html).toContain('Hoàn thành không cần ghi chú');
    });

    it('không render khi isOpen = false hoặc task = null', () => {
      const html = renderToString(
        <QuickTaskCompletionModal
          isOpen={false}
          task={null}
          onClose={() => {}}
          onConfirm={async () => {}}
        />
      );
      expect(html).toBe('');
    });
  });

  /* =========================================================================
   * 3. AC 3: Kết nối API Service (onboardingService.ts)
   * ========================================================================= */
  describe('AC 3: Kết nối API Service (onboardingService)', () => {
    it('updateChecklistItemStatus cập nhật trạng thái thành công và tự động tính toán lại % tiến độ', async () => {
      const employeeId = 'cand-final-001';
      const itemId = 'task-an-2'; // "Cài đặt hệ điều hành và thiết lập môi trường máy trạm"

      const response = await onboardingService.updateChecklistItemStatus(
        employeeId,
        itemId,
        {
          status: 'COMPLETED',
          completedAt: '2026-10-15T10:00:00Z',
          completedBy: 'Đặng Quốc Huy (IT Admin)',
          notes: 'Đã bàn giao laptop Dell Latitude mã số LT-042',
        }
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();

      const updatedTask = response.data.tasks.find((t) => t.id === itemId);
      expect(updatedTask?.status).toBe('COMPLETED');
      expect(updatedTask?.notes).toBe('Đã bàn giao laptop Dell Latitude mã số LT-042');
      expect(updatedTask?.completedBy).toBe('Đặng Quốc Huy (IT Admin)');

      // Tự động tính toán lại tổng % tiến độ (AC 3)
      expect(response.refreshedSummary).toBeDefined();
      expect(response.refreshedSummary?.totalTasks).toBe(10);
      expect(response.refreshedSummary?.completedTasks).toBeGreaterThanOrEqual(1);
      expect(response.refreshedSummary?.percentage).toBeGreaterThan(0);
    });

    it('hỗ trợ cập nhật trạng thái PENDING tương ứng với NOT_STARTED', async () => {
      const employeeId = 'cand-final-001';
      const itemId = 'task-an-2';

      const response = await onboardingService.updateChecklistItemStatus(
        employeeId,
        itemId,
        {
          status: 'PENDING',
        }
      );

      expect(response.success).toBe(true);
      const task = response.data.tasks.find((t) => t.id === itemId);
      expect(task?.status).toBe('NOT_STARTED');
      expect(task?.completedAt).toBeUndefined();
    });

    it('bắt lỗi mạng và ném ngoại lệ tiếng Việt thân thiện phục vụ rollback (AC 3)', async () => {
      const employeeId = 'cand-final-001';
      const itemId = 'task-an-1';

      await expect(
        onboardingService.updateChecklistItemStatus(
          employeeId,
          itemId,
          { status: 'COMPLETED' },
          { simulateError: true }
        )
      ).rejects.toThrow('Lỗi kết nối máy chủ backend. Không thể lưu trạng thái đầu việc.');
    });

    it('refreshOnboardingProgress tính toán và trả về tổng % tiến độ mới nhất', async () => {
      const summary = await onboardingService.refreshOnboardingProgress('cand-final-001');
      expect(summary).toBeDefined();
      expect(summary.totalTasks).toBe(10);
      expect(typeof summary.percentage).toBe('number');
    });
  });

  /* =========================================================================
   * 4. Integration: OnboardingTrackingBoard với Phân quyền & Khóa thao tác
   * ========================================================================= */
  describe('Tích hợp Giao diện Bảng theo dõi với Phân quyền người dùng', () => {
    it('hiển thị khóa và tooltip cảnh báo khi người dùng không có quyền trên đầu việc khác bộ phận', () => {
      const restrictedUser: UserPermissionContext = {
        id: 'usr-restricted',
        fullName: 'Nhân viên Kế toán',
        email: 'ketoan@smartrecruit.vn',
        roles: ['ACCOUNTANT'],
      };

      const html = renderToString(
        <ToastProvider>
          <OnboardingTrackingBoard
            initialRecord={mockCandidateRecord}
            currentUser={restrictedUser}
          />
        </ToastProvider>
      );

      // Hiển thị bộ chọn giả lập vai trò
      expect(html).toContain('data-testid="select-simulated-role"');

      // Khóa và cảnh báo quyền hạn đối với task IT và task HR
      expect(html).toContain('data-testid="badge-permission-locked-task-it-01"');
      expect(html).toContain('Khác bộ phận');
      expect(html).toContain('data-testid="badge-locked-task-task-it-01"');

      // Nút ghi chú nhanh trên từng dòng
      expect(html).toContain('data-testid="btn-quick-note-task-it-01"');
      expect(html).toContain('data-testid="btn-quick-note-task-hr-02"');
    });
  });
});
