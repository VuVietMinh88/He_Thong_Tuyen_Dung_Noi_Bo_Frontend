import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { OnboardingTrackingBoard } from '../src/components/Onboarding/OnboardingTrackingBoard';
import { OnboardingProgressBar } from '../src/components/Onboarding/OnboardingProgressBar';
import { OnboardingTaskDetailModal } from '../src/components/Onboarding/OnboardingTaskDetailModal';
import { ToastProvider } from '../src/components/notifications/ToastProvider';
import {
  onboardingTrackingService,
  MOCK_CANDIDATE_ONBOARDING_RECORDS,
} from '../src/services/onboardingTrackingService';
import {
  calculateOnboardingProgress,
  isTaskOverdue,
  getDeadlineDisplay,
} from '../src/utils/onboardingTrackingHelper';
import type {
  OnboardingCandidateTask,
  CandidateOnboardingRecord,
} from '../src/types/onboardingChecklist';

describe('Jira Task TKNHTTDNB1-518: Thiết kế checklist nhận việc và phần trăm hoàn thành (User Story S8-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockTasks: OnboardingCandidateTask[] = [
    {
      id: 'task-test-01',
      title: 'Tạo tài khoản Google Workspace & GitLab',
      description: 'Cấp email @smartrecruit.vn và add vào group gitlab frontend',
      phase: 'PRE_BOARDING',
      responsibleRole: 'IT_SUPPORT',
      assigneeName: 'Đặng Quốc Huy (IT Admin)',
      deadline: '2026-10-14', // Đã quá hạn so với mốc tham chiếu 2026-10-15
      status: 'NOT_STARTED',
      isRequired: true,
      category: 'Tài khoản & Thiết bị',
      order: 1,
    },
    {
      id: 'task-test-02',
      title: 'Ký Hợp đồng thử việc & Bàn giao hồ sơ gốc',
      description: 'Nộp ảnh 3x4, CCCD công chứng và ký HĐLĐ thử việc',
      phase: 'DAY_ONE',
      responsibleRole: 'HR',
      assigneeName: 'Trần Thị Thu (HR Generalist)',
      deadline: '2026-10-16',
      status: 'IN_PROGRESS',
      isRequired: true,
      category: 'Thủ tục nhân sự',
      order: 2,
    },
    {
      id: 'task-test-03',
      title: 'Đọc Sổ tay nhân viên và chính sách bảo mật NDA',
      description: 'Tìm hiểu văn hóa doanh nghiệp và quy định an toàn thông tin',
      phase: 'DAY_ONE',
      responsibleRole: 'NEW_HIRE',
      assigneeName: 'Nguyễn Văn An (Nhân sự mới)',
      deadline: '2026-10-15',
      status: 'COMPLETED',
      completedAt: '2026-10-15T09:30:00Z',
      completedBy: 'Nguyễn Văn An',
      isRequired: true,
      category: 'Hội nhập',
      order: 3,
      attachments: [
        {
          id: 'att-test-01',
          fileName: 'So_Tay_Nhan_Vien_SmartRecruit_2026.pdf',
          fileSize: '3.4 MB',
          fileType: 'PDF',
          url: 'https://smartrecruit.internal/docs/employee-handbook.pdf',
        },
      ],
    },
    {
      id: 'task-test-04',
      title: 'Thiết lập môi trường làm việc dự án Frontend',
      description: 'Clone repo, cài đặt node_modules và build thành công',
      phase: 'FIRST_WEEK',
      responsibleRole: 'NEW_HIRE',
      assigneeName: 'Lê Hoàng Nam (Buddy)',
      deadline: '2026-10-20',
      status: 'NOT_STARTED',
      isRequired: true,
      category: 'Kỹ thuật',
      order: 4,
    },
  ];

  const mockCandidateRecord: CandidateOnboardingRecord = {
    id: 'ONB-TEST-001',
    candidateId: 'cand-test-001',
    candidateName: 'Nguyễn Văn An',
    candidateCode: 'EMP-2026-0891',
    candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    candidateEmail: 'an.nguyen@smartrecruit.vn',
    jobTitle: 'Senior Frontend Developer',
    departmentId: 'dept-it',
    departmentName: 'Phòng Công Nghệ Thông Tin (IT)',
    startDate: '2026-10-15',
    buddyName: 'Lê Hoàng Nam',
    managerName: 'Vũ Đức Đam (Tech Lead)',
    hrInCharge: 'Trần Thị Thu (HR Onboarding)',
    tasks: mockTasks,
    createdAt: '2026-10-10T08:00:00Z',
    updatedAt: '2026-10-15T09:30:00Z',
  };

  /* =========================================================================
   * 1. Unit Tests: Helper tính toán tiến độ, hạn chót và trạng thái (AC 1 & AC 2)
   * ========================================================================= */
  describe('Helper tính toán tiến độ & Deadline (onboardingTrackingHelper)', () => {
    it('tính toán chính xác tỷ lệ hoàn thành (completed / total) * 100% và phân loại 4 trạng thái', () => {
      // 1 hoàn thành, 1 đang xử lý, 1 quá hạn (chưa xong & deadline 14 < 15), 1 chưa bắt đầu => Tổng = 4
      const summary = calculateOnboardingProgress(mockTasks, '2026-10-15');

      expect(summary.totalTasks).toBe(4);
      expect(summary.completedTasks).toBe(1);
      expect(summary.inProgressTasks).toBe(1);
      expect(summary.overdueTasks).toBe(1); // task-test-01 deadline 2026-10-14 quá hạn
      expect(summary.notStartedTasks).toBe(2); // task-test-01 & task-test-04
      expect(summary.percentage).toBe(25); // (1 / 4) * 100% = 25%
    });

    it('trả về 0% và an toàn khi danh sách nhiệm vụ rỗng', () => {
      const emptySummary = calculateOnboardingProgress([]);
      expect(emptySummary.totalTasks).toBe(0);
      expect(emptySummary.completedTasks).toBe(0);
      expect(emptySummary.percentage).toBe(0);
    });

    it('tính toán tiến độ cho từng giai đoạn (Phase Progress)', () => {
      const summary = calculateOnboardingProgress(mockTasks, '2026-10-15');

      expect(summary.phaseProgress.PRE_BOARDING.total).toBe(1);
      expect(summary.phaseProgress.PRE_BOARDING.completed).toBe(0);
      expect(summary.phaseProgress.PRE_BOARDING.percentage).toBe(0);

      expect(summary.phaseProgress.DAY_ONE.total).toBe(2);
      expect(summary.phaseProgress.DAY_ONE.completed).toBe(1);
      expect(summary.phaseProgress.DAY_ONE.percentage).toBe(50);

      expect(summary.phaseProgress.FIRST_WEEK.total).toBe(1);
      expect(summary.phaseProgress.FIRST_WEEK.completed).toBe(0);

      expect(summary.phaseProgress.FIRST_MONTH.total).toBe(0);
    });

    it('nhận diện chính xác nhiệm vụ quá hạn (isTaskOverdue)', () => {
      const overdueTask = mockTasks[0]; // deadline: 2026-10-14, NOT_STARTED
      const upcomingTask = mockTasks[1]; // deadline: 2026-10-16, IN_PROGRESS
      const completedTask = mockTasks[2]; // deadline: 2026-10-15, COMPLETED

      expect(isTaskOverdue(overdueTask, '2026-10-15')).toBe(true);
      expect(isTaskOverdue(upcomingTask, '2026-10-15')).toBe(false);
      // Nhiệm vụ đã hoàn thành không bao giờ bị tính là quá hạn
      expect(isTaskOverdue(completedTask, '2026-10-15')).toBe(false);
    });

    it('format ngày hạn chót và trả về badge cảnh báo đỏ khi quá hạn (getDeadlineDisplay)', () => {
      const overdueDisplay = getDeadlineDisplay('2026-10-14', false, '2026-10-15');
      expect(overdueDisplay.isOverdue).toBe(true);
      expect(overdueDisplay.formattedDate).toBe('14/10/2026');
      expect(overdueDisplay.badgeText).toContain('Quá hạn');
      expect(overdueDisplay.badgeClass).toContain('bg-rose-50');
      expect(overdueDisplay.badgeClass).toContain('text-rose-700');

      const todayDisplay = getDeadlineDisplay('2026-10-15', false, '2026-10-15');
      expect(todayDisplay.isOverdue).toBe(false);
      expect(todayDisplay.badgeText).toBe('Hôm nay');

      const futureDisplay = getDeadlineDisplay('2026-10-20', false, '2026-10-15');
      expect(futureDisplay.isOverdue).toBe(false);
      expect(futureDisplay.badgeText).toBe('Còn 5 ngày');

      const completedDisplay = getDeadlineDisplay('2026-10-10', true, '2026-10-15');
      expect(completedDisplay.isOverdue).toBe(false);
      expect(completedDisplay.badgeText).toBe('Đã hoàn thành');
    });
  });

  /* =========================================================================
   * 2. Unit Tests: Service quản lý tiến độ Onboarding (onboardingTrackingService)
   * ========================================================================= */
  describe('Service quản lý tiến độ Onboarding (onboardingTrackingService)', () => {
    it('lấy danh sách tất cả hồ sơ tiếp nhận nhân sự mới', async () => {
      const records = await onboardingTrackingService.listCandidateOnboardingRecords();
      expect(records.length).toBeGreaterThanOrEqual(1);
      expect(records[0].candidateName).toBe('Nguyễn Văn An');
      expect(records[0].departmentName.toLowerCase()).toContain('công nghệ thông tin');
    });

    it('lấy chi tiết một hồ sơ tiếp nhận theo candidateId hoặc recordId', async () => {
      const record = await onboardingTrackingService.getCandidateOnboardingRecord('cand-final-001');
      expect(record).toBeDefined();
      expect(record.id).toBe('ONB-2026-0891');
      expect(record.tasks.length).toBe(10);
    });

    it('chuyển đổi (toggle) trạng thái hoàn thành của một nhiệm vụ', async () => {
      const record = await onboardingTrackingService.getCandidateOnboardingRecord('cand-final-001');
      const targetTask = record.tasks[0];
      const initialStatus = targetTask.status;

      // Toggle từ chưa hoàn thành -> COMPLETED
      const updatedRecord = await onboardingTrackingService.toggleTaskStatus(
        record.id,
        targetTask.id
      );
      const updatedTask = updatedRecord.tasks.find((t) => t.id === targetTask.id);
      expect(updatedTask?.status).toBe(initialStatus === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED');

      // Toggle lần nữa để trả về trạng thái ban đầu
      const revertedRecord = await onboardingTrackingService.toggleTaskStatus(
        record.id,
        targetTask.id
      );
      const revertedTask = revertedRecord.tasks.find((t) => t.id === targetTask.id);
      expect(revertedTask?.status).toBe(initialStatus);
    });

    it('cập nhật chi tiết nhiệm vụ bao gồm ghi chú và trạng thái mới', async () => {
      const record = await onboardingTrackingService.getCandidateOnboardingRecord('cand-final-001');
      const targetTask = record.tasks[1];

      const updatedRecord = await onboardingTrackingService.updateTaskDetails(
        record.id,
        targetTask.id,
        {
          status: 'IN_PROGRESS',
          notes: 'Đã hoàn tất cấu hình VPN và chờ cấp thẻ ra vào tòa nhà',
        }
      );

      const updatedTask = updatedRecord.tasks.find((t) => t.id === targetTask.id);
      expect(updatedTask?.status).toBe('IN_PROGRESS');
      expect(updatedTask?.notes).toBe('Đã hoàn tất cấu hình VPN và chờ cấp thẻ ra vào tòa nhà');
    });
  });

  /* =========================================================================
   * 3. Component Tests: Thanh tiến trình & Chỉ số hoàn thành (AC 1)
   * ========================================================================= */
  describe('AC 1: Thanh tiến trình & Chỉ số hoàn thành (OnboardingProgressBar)', () => {
    it('hiển thị thanh tiến trình trực quan với tỷ lệ % và các badge đếm số lượng 4 trạng thái', () => {
      const summary = calculateOnboardingProgress(mockTasks, '2026-10-15');

      const html = renderToString(
        <OnboardingProgressBar summary={summary} />
      );

      // Container thanh tiến trình (AC 1)
      expect(html).toContain('data-testid="onboarding-progress-overview"');
      expect(html).toContain('data-testid="progress-bar-container"');
      expect(html).toContain('data-testid="progress-bar-fill"');

      // Tỷ lệ % hoàn thành (AC 1)
      expect(html).toContain('data-testid="text-progress-percentage"');
      expect(html).toContain('25%');
      expect(html).toContain('1/4 đầu việc');

      // Các badge đếm số lượng (AC 1)
      // 1. Đã xong
      expect(html).toContain('data-testid="badge-stat-completed"');
      expect(html).toContain('Đã xong: 1');

      // 2. Đang xử lý
      expect(html).toContain('data-testid="badge-stat-in-progress"');
      expect(html).toContain('Đang xử lý: 1');

      // 3. Quá hạn (Overdue) kèm cảnh báo
      expect(html).toContain('data-testid="badge-stat-overdue"');
      expect(html).toContain('Quá hạn: 1');
      expect(html).toContain('Cần xử lý gấp');

      // 4. Chưa bắt đầu
      expect(html).toContain('data-testid="badge-stat-not-started"');
      expect(html).toContain('Chưa bắt đầu: 2');

      // Phân chia theo từng giai đoạn (Pre-boarding, Day 1, Week 1, Month 1)
      expect(html).toContain('data-testid="phase-progress-list"');
      expect(html).toContain('Pre-boarding');
      expect(html).toContain('Day 1');
      expect(html).toContain('Week 1');
      expect(html).toContain('Month 1');
    });
  });

  /* =========================================================================
   * 4. Component Tests: Chi tiết nhiệm vụ & Tệp đính kèm (AC 3)
   * ========================================================================= */
  describe('AC 3: Chi tiết nhiệm vụ & Tệp đính kèm (OnboardingTaskDetailModal)', () => {
    it('không hiển thị khi isOpen = false hoặc task = null', () => {
      const html = renderToString(
        <OnboardingTaskDetailModal
          isOpen={false}
          task={null}
          onClose={() => {}}
          onUpdateStatus={() => {}}
        />
      );
      expect(html).toBe('');
    });

    it('hiển thị đầy đủ ghi chú hướng dẫn, tệp đính kèm, link thao tác và thông tin người hỗ trợ', () => {
      const taskWithAttachment = mockTasks[2]; // có file So_Tay_Nhan_Vien_SmartRecruit_2026.pdf

      const html = renderToString(
        <OnboardingTaskDetailModal
          isOpen={true}
          task={taskWithAttachment}
          onClose={() => {}}
          onUpdateStatus={() => {}}
          onSaveNotes={() => {}}
        />
      );

      // Modal container (AC 3)
      expect(html).toContain('data-testid="onboarding-task-detail-modal"');
      expect(html).toContain('data-testid="task-detail-title"');
      expect(html).toContain(taskWithAttachment.title);

      // Ghi chú hướng dẫn (AC 3)
      expect(html).toContain('Ghi chú hướng dẫn chi tiết');
      expect(html).toContain(taskWithAttachment.description);

      // Người hỗ trợ & Hạn chót (AC 2)
      expect(html).toContain('Người chịu trách nhiệm hỗ trợ (Assignee):');
      expect(html).toContain(taskWithAttachment.assigneeName);
      expect(html).toContain('Hạn chót hoàn thành (Deadline):');

      // Tài liệu biểu mẫu đính kèm (AC 3)
      expect(html).toContain('data-testid="task-attachments-list"');
      expect(html).toContain('So_Tay_Nhan_Vien_SmartRecruit_2026.pdf');
      expect(html).toContain('3.4 MB');

      // Nút cập nhật trạng thái
      expect(html).toContain('data-testid="btn-status-in-progress"');
      expect(html).toContain('data-testid="btn-status-complete"');

      // Textarea ghi chú
      expect(html).toContain('data-testid="textarea-task-notes"');
      expect(html).toContain('data-testid="btn-save-task-notes"');
    });
  });

  /* =========================================================================
   * 5. Integration Tests: Bảng theo dõi tiến độ tiếp nhận (OnboardingTrackingBoard)
   * ========================================================================= */
  describe('Giao diện Bảng theo dõi tiến độ tiếp nhận (OnboardingTrackingBoard)', () => {
    it('render đầy đủ thông tin nhân sự mới, thanh tiến độ tổng quan và danh sách nhiệm vụ 4 giai đoạn', () => {
      const html = renderToString(
        <ToastProvider>
          <OnboardingTrackingBoard
            initialRecord={mockCandidateRecord}
          />
        </ToastProvider>
      );

      // Board container
      expect(html).toContain('data-testid="onboarding-tracking-board"');

      // Thông tin nhân sự mới (Header)
      expect(html).toContain('Nguyễn Văn An');
      expect(html).toContain('EMP-2026-0891');
      expect(html).toContain('Senior Frontend Developer');
      expect(html).toContain('Phòng Công Nghệ Thông Tin (IT)');
      expect(html).toContain('Vũ Đức Đam (Tech Lead)');
      expect(html).toContain('Lê Hoàng Nam');
      expect(html).toContain('Trần Thị Thu (HR Onboarding)');

      // Thanh tiến trình & % Hoàn thành (AC 1)
      expect(html).toContain('data-testid="onboarding-progress-overview"');
      expect(html).toContain('data-testid="text-progress-percentage"');
      expect(html).toContain('25%');

      // 4 giai đoạn phân nhóm rõ ràng (AC 2)
      expect(html).toContain('phase-card-group-PRE_BOARDING');
      expect(html).toContain('phase-card-group-DAY_ONE');
      expect(html).toContain('phase-card-group-FIRST_WEEK');
      expect(html).toContain('phase-card-group-FIRST_MONTH');

      // Kiểm tra nhãn giai đoạn theo chuẩn AC 2
      expect(html).toContain('Trước khi đi làm');
      expect(html).toContain('Ngày đầu tiên');
      expect(html).toContain('Tuần đầu tiên');
      expect(html).toContain('Tháng thử việc đầu tiên');

      // Kiểm tra chi tiết hiển thị của nhiệm vụ: Checkbox, Assignee, Deadline cảnh báo đỏ (AC 2)
      expect(html).toContain('checkbox-task-complete-task-test-01');
      expect(html).toContain('checkbox-task-complete-task-test-02');
      expect(html).toContain('checkbox-task-complete-task-test-03');
      expect(html).toContain('checkbox-task-complete-task-test-04');

      // Cảnh báo quá hạn màu đỏ cho task-test-01 (AC 2)
      expect(html).toContain('Quá hạn');
      expect(html).toContain('Đặng Quốc Huy (IT Admin)');

      // Bộ lọc và thanh tìm kiếm
      expect(html).toContain('data-testid="input-search-tasks"');
      expect(html).toContain('data-testid="select-phase-filter"');
      expect(html).toContain('data-testid="select-status-filter"');
    });

    it('render từ dữ liệu mẫu mặc định MOCK_CANDIDATE_ONBOARDING_RECORDS', () => {
      expect(MOCK_CANDIDATE_ONBOARDING_RECORDS.length).toBeGreaterThan(0);
      const html = renderToString(
        <ToastProvider>
          <OnboardingTrackingBoard
            initialCandidateId="cand-final-001"
          />
        </ToastProvider>
      );

      expect(html).toContain('data-testid="onboarding-tracking-board"');
      expect(html).toContain('Nguyễn Văn An');
      expect(html).toContain('select-candidate-record');
    });
  });
});
