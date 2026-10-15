import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { OnboardingChecklistTemplateManager } from '../src/components/Onboarding/OnboardingChecklistTemplateManager';
import { ChecklistItemModal } from '../src/components/Onboarding/ChecklistItemModal';
import { ToastProvider } from '../src/components/notifications/ToastProvider';
import {
  onboardingChecklistService,
  DEFAULT_DEPARTMENT_TEMPLATES,
} from '../src/services/onboardingChecklistService';
import {
  validateChecklistItem,
  getPhaseConfig,
  getRoleConfig,
  calculateTemplateStats,
  moveChecklistItem,
  reorderChecklistItems,
} from '../src/utils/onboardingChecklistHelper';
import type {
  OnboardingChecklistItem,
  DepartmentChecklistTemplate,
} from '../src/types/onboardingChecklist';
import axiosClient from '../src/utils/axiosClient';

describe('Jira Task TKNHTTDNB1-517: Thiết kế mẫu checklist tiếp nhận theo phòng ban (User Story S8-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC 1: Quản lý danh sách mẫu Checklist & Bộ chọn phòng ban', () => {
    it('render giao diện quản lý mẫu checklist với bộ chọn phòng ban, thống kê KPI và danh sách đầu việc', () => {
      const html = renderToString(
        <ToastProvider>
          <OnboardingChecklistTemplateManager initialDepartmentId="dept-it" />
        </ToastProvider>
      );

      // Tiêu đề trang
      expect(html).toContain('Mẫu Checklist tiếp nhận theo phòng ban');
      expect(html).toContain('data-testid="onboarding-checklist-template-manager"');

      // Bộ chọn phòng ban (Department Selector - AC 1)
      expect(html).toContain('dept-tab-dept-it');
      expect(html).toContain('dept-tab-dept-marketing');
      expect(html).toContain('dept-tab-dept-sales');
      expect(html).toContain('dept-tab-dept-hr');
      expect(html).toContain('dept-tab-dept-accounting');

      // Thống kê KPI (AC 1)
      expect(html).toContain('data-testid="stat-total-items"');
      expect(html).toContain('data-testid="stat-active-items"');
      expect(html).toContain('data-testid="stat-required-items"');
      expect(html).toContain('data-testid="stat-max-sla"');

      // Các nhóm giai đoạn tiếp nhận (AC 1)
      expect(html).toContain('phase-group-PRE_BOARDING');
      expect(html).toContain('phase-group-DAY_ONE');
      expect(html).toContain('phase-group-FIRST_WEEK');
      expect(html).toContain('phase-group-FIRST_MONTH');

      // Nút chức năng
      expect(html).toContain('data-testid="btn-add-item-primary"');
      expect(html).toContain('data-testid="btn-save-template"');
      expect(html).toContain('data-testid="btn-reset-template"');
    });

    it('tính toán chính xác các số liệu thống kê trong calculateTemplateStats', () => {
      const itTemplate = DEFAULT_DEPARTMENT_TEMPLATES.find((t) => t.departmentId === 'dept-it');
      expect(itTemplate).toBeDefined();

      const stats = calculateTemplateStats(itTemplate!.items);
      expect(stats.totalItems).toBe(8);
      expect(stats.activeItems).toBe(8);
      expect(stats.inactiveItems).toBe(0);
      expect(stats.requiredItems).toBe(7);
      expect(stats.maxSlaDays).toBe(30);

      // Phân bổ theo giai đoạn
      expect(stats.phaseDistribution.PRE_BOARDING).toBe(2);
      expect(stats.phaseDistribution.DAY_ONE).toBe(3);
      expect(stats.phaseDistribution.FIRST_WEEK).toBe(2);
      expect(stats.phaseDistribution.FIRST_MONTH).toBe(1);

      // Phân bổ theo vai trò
      expect(stats.roleDistribution.IT_SUPPORT).toBe(2);
      expect(stats.roleDistribution.HR).toBe(1);
      expect(stats.roleDistribution.DIRECT_MANAGER).toBe(3);
      expect(stats.roleDistribution.NEW_HIRE).toBe(2);
    });

    it('trả về đúng nhãn và badge styling cho các giai đoạn và vai trò phụ trách', () => {
      const preBoardingConfig = getPhaseConfig('PRE_BOARDING');
      expect(preBoardingConfig.label).toBe('Trước ngày nhận việc');
      expect(preBoardingConfig.shortLabel).toBe('Pre-boarding');

      const dayOneConfig = getPhaseConfig('DAY_ONE');
      expect(dayOneConfig.label).toBe('Ngày đầu tiên');
      expect(dayOneConfig.shortLabel).toBe('Day 1');

      const itRoleConfig = getRoleConfig('IT_SUPPORT');
      expect(itRoleConfig.label).toBe('Bộ phận CNTT (IT Support)');

      const managerRoleConfig = getRoleConfig('DIRECT_MANAGER');
      expect(managerRoleConfig.label).toBe('Quản lý trực tiếp');
    });
  });

  describe('AC 2: Thêm và chỉnh sửa đầu việc mẫu (Checklist Item Builder)', () => {
    it('render ChecklistItemModal ở chế độ Thêm mới với các trường bắt buộc', () => {
      const html = renderToString(
        <ChecklistItemModal
          isOpen={true}
          itemToEdit={null}
          defaultPhase="PRE_BOARDING"
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      );

      expect(html).toContain('data-testid="checklist-item-modal"');
      expect(html).toContain('Thêm đầu việc mẫu mới');
      expect(html).toContain('data-testid="input-item-title"');
      expect(html).toContain('data-testid="select-item-phase"');
      expect(html).toContain('data-testid="select-item-role"');
      expect(html).toContain('data-testid="input-item-due-days"');
      expect(html).toContain('data-testid="textarea-item-description"');
      expect(html).toContain('data-testid="checkbox-item-required"');
      expect(html).toContain('data-testid="checkbox-item-active"');
      expect(html).toContain('data-testid="btn-save-item-modal"');
    });

    it('render ChecklistItemModal ở chế độ Chỉnh sửa với dữ liệu có sẵn', () => {
      const existingItem: OnboardingChecklistItem = {
        id: 'test-item-1',
        title: 'Cài đặt môi trường Node.js & React local',
        description: 'Cài đặt Node 20, yarn và cấu hình eslint',
        phase: 'DAY_ONE',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 2,
        isRequired: true,
        isActive: true,
        order: 1,
        category: 'Kỹ thuật',
      };

      const html = renderToString(
        <ChecklistItemModal
          isOpen={true}
          itemToEdit={existingItem}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      );

      expect(html).toContain('Chỉnh sửa đầu việc mẫu');
      expect(html).toContain('Cài đặt môi trường Node.js &amp; React local');
      expect(html).toContain('Cập nhật đầu việc');
    });

    it('validateChecklistItem phát hiện chính xác các lỗi nhập liệu', () => {
      // 1. Trường hợp hợp lệ
      const valid = validateChecklistItem({
        title: 'Bàn giao tài liệu bảo mật nội bộ',
        dueDays: 3,
        phase: 'DAY_ONE',
        responsibleRole: 'HR',
      });
      expect(valid.isValid).toBe(true);
      expect(Object.keys(valid.errors).length).toBe(0);

      // 2. Tiêu đề rỗng hoặc quá ngắn
      const emptyTitle = validateChecklistItem({
        title: '',
        dueDays: 1,
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
      });
      expect(emptyTitle.isValid).toBe(false);
      expect(emptyTitle.errors.title).toContain('Vui lòng nhập tên công việc');

      const shortTitle = validateChecklistItem({
        title: 'AB',
        dueDays: 1,
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
      });
      expect(shortTitle.isValid).toBe(false);
      expect(shortTitle.errors.title).toContain('ít nhất 3 ký tự');

      // 3. Thời hạn SLA không hợp lệ (<= 0 hoặc không phải số nguyên)
      const invalidSla = validateChecklistItem({
        title: 'Cấp thẻ nhân viên',
        dueDays: 0,
        phase: 'PRE_BOARDING',
        responsibleRole: 'HR',
      });
      expect(invalidSla.isValid).toBe(false);
      expect(invalidSla.errors.dueDays).toContain('số nguyên dương');

      // 4. Vai trò hoặc Giai đoạn không hợp lệ
      const invalidRole = validateChecklistItem({
        title: 'Đăng ký tài khoản',
        dueDays: 1,
        phase: 'PRE_BOARDING',
        responsibleRole: 'UNKNOWN' as any,
      });
      expect(invalidRole.isValid).toBe(false);
      expect(invalidRole.errors.responsibleRole).toContain('vai trò phụ trách');
    });
  });

  describe('AC 3: Thao tác sắp xếp thứ tự & Trạng thái áp dụng', () => {
    it('moveChecklistItem di chuyển thứ tự lên/xuống chính xác và cập nhật order', () => {
      const items: OnboardingChecklistItem[] = [
        { id: 'item-1', title: 'Task 1', description: '', phase: 'PRE_BOARDING', responsibleRole: 'HR', dueDays: 1, isRequired: true, isActive: true, order: 1 },
        { id: 'item-2', title: 'Task 2', description: '', phase: 'PRE_BOARDING', responsibleRole: 'HR', dueDays: 1, isRequired: true, isActive: true, order: 2 },
        { id: 'item-3', title: 'Task 3', description: '', phase: 'PRE_BOARDING', responsibleRole: 'HR', dueDays: 1, isRequired: true, isActive: true, order: 3 },
      ];

      // Di chuyển item-2 lên đầu (index 1 -> index 0)
      const movedUp = moveChecklistItem(items, 'item-2', 'UP');
      expect(movedUp[0].id).toBe('item-2');
      expect(movedUp[0].order).toBe(1);
      expect(movedUp[1].id).toBe('item-1');
      expect(movedUp[1].order).toBe(2);

      // Di chuyển item-1 xuống dưới
      const movedDown = moveChecklistItem(items, 'item-1', 'DOWN');
      expect(movedDown[0].id).toBe('item-2');
      expect(movedDown[1].id).toBe('item-1');

      // Di chuyển phần tử đầu tiên lên trên không gây lỗi
      const noopUp = moveChecklistItem(items, 'item-1', 'UP');
      expect(noopUp[0].id).toBe('item-1');

      // Di chuyển phần tử cuối cùng xuống dưới không gây lỗi
      const noopDown = moveChecklistItem(items, 'item-3', 'DOWN');
      expect(noopDown[2].id).toBe('item-3');
    });

    it('reorderChecklistItems sắp xếp lại theo vị trí kéo thả Drag & Drop', () => {
      const items: OnboardingChecklistItem[] = [
        { id: 'item-1', title: 'Task 1', description: '', phase: 'DAY_ONE', responsibleRole: 'HR', dueDays: 1, isRequired: true, isActive: true, order: 1 },
        { id: 'item-2', title: 'Task 2', description: '', phase: 'DAY_ONE', responsibleRole: 'HR', dueDays: 1, isRequired: true, isActive: true, order: 2 },
        { id: 'item-3', title: 'Task 3', description: '', phase: 'DAY_ONE', responsibleRole: 'HR', dueDays: 1, isRequired: true, isActive: true, order: 3 },
      ];

      const reordered = reorderChecklistItems(items, 2, 0); // Kéo item-3 lên vị trí 0
      expect(reordered[0].id).toBe('item-3');
      expect(reordered[0].order).toBe(1);
      expect(reordered[1].id).toBe('item-1');
      expect(reordered[1].order).toBe(2);
      expect(reordered[2].id).toBe('item-2');
      expect(reordered[2].order).toBe(3);
    });

    it('onboardingChecklistService.saveDepartmentTemplate gọi API backend hoặc lưu local', async () => {
      const mockTemplate: DepartmentChecklistTemplate = {
        departmentId: 'dept-it',
        departmentName: 'Khối CNTT',
        departmentCode: 'TECH',
        description: 'Cập nhật mẫu mới',
        lastUpdated: new Date().toISOString(),
        items: [
          {
            id: 'it-custom-1',
            title: 'Setup Macbook Pro M3',
            description: 'RAM 36GB',
            phase: 'PRE_BOARDING',
            responsibleRole: 'IT_SUPPORT',
            dueDays: 1,
            isRequired: true,
            isActive: true,
            order: 1,
          },
        ],
      };

      const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
        data: {
          data: mockTemplate,
        },
      });

      const result = await onboardingChecklistService.saveDepartmentTemplate('dept-it', mockTemplate);

      expect(putSpy).toHaveBeenCalledWith('/onboarding/templates/dept-it', expect.any(Object));
      expect(result.departmentId).toBe('dept-it');
      expect(result.items.length).toBe(1);
      expect(result.items[0].title).toBe('Setup Macbook Pro M3');
    });

    it('onboardingChecklistService.resetDepartmentTemplateToDefault khôi phục thành công cấu hình chuẩn', async () => {
      vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
        data: {
          data: DEFAULT_DEPARTMENT_TEMPLATES[0],
        },
      });

      const restored = await onboardingChecklistService.resetDepartmentTemplateToDefault('dept-it');
      expect(restored.departmentId).toBe('dept-it');
      expect(restored.items.length).toBe(DEFAULT_DEPARTMENT_TEMPLATES[0].items.length);
    });
  });
});
