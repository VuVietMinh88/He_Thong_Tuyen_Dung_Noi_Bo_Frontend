import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  Plus,
  Save,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Copy,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Sparkles,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import type {
  DepartmentChecklistTemplate,
  OnboardingChecklistItem,
  OnboardingTaskPhase,
} from '../../types/onboardingChecklist';
import {
  ONBOARDING_PHASES,
  ONBOARDING_ROLES,
} from '../../types/onboardingChecklist';
import {
  onboardingChecklistService,
  DEFAULT_DEPARTMENT_TEMPLATES,
} from '../../services/onboardingChecklistService';
import {
  getPhaseConfig,
  getRoleConfig,
  calculateTemplateStats,
  moveChecklistItem,
} from '../../utils/onboardingChecklistHelper';
import { ChecklistItemModal } from './ChecklistItemModal';
import { useToast } from '../notifications/useToast';

export interface OnboardingChecklistTemplateManagerProps {
  initialDepartmentId?: string;
  initialTemplates?: DepartmentChecklistTemplate[];
  onTemplateSaved?: (template: DepartmentChecklistTemplate) => void;
}

export const OnboardingChecklistTemplateManager: React.FC<OnboardingChecklistTemplateManagerProps> = ({
  initialDepartmentId = 'dept-it',
  initialTemplates,
  onTemplateSaved,
}) => {
  const { addToast } = useToast();

  // 1. Quản lý danh sách phòng ban & template hiện tại (AC 1)
  const [departmentTemplates, setDepartmentTemplates] = useState<DepartmentChecklistTemplate[]>(
    () => initialTemplates || DEFAULT_DEPARTMENT_TEMPLATES
  );
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDepartmentId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Template của phòng ban được chọn
  const [currentTemplate, setCurrentTemplate] = useState<DepartmentChecklistTemplate>(() => {
    const list = initialTemplates || DEFAULT_DEPARTMENT_TEMPLATES;
    return list.find((t) => t.departmentId === initialDepartmentId) || list[0];
  });

  // 2. Bộ lọc & Tìm kiếm (AC 1)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GROUPED' | 'TABLE'>('GROUPED');

  // Trạng thái đóng/mở các nhóm giai đoạn
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    PRE_BOARDING: true,
    DAY_ONE: true,
    FIRST_WEEK: true,
    FIRST_MONTH: true,
  });

  // 3. Modal thêm / sửa đầu việc mẫu (AC 2)
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<OnboardingChecklistItem | null>(null);
  const [defaultPhaseForNewItem, setDefaultPhaseForNewItem] = useState<OnboardingTaskPhase>('PRE_BOARDING');

  // Modal xác nhận reset mẫu
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Tải danh sách mẫu khi mount
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const templates = await onboardingChecklistService.getDepartmentTemplates();
      setDepartmentTemplates(templates);

      const current = templates.find((t) => t.departmentId === selectedDeptId) || templates[0];
      if (current) {
        setCurrentTemplate(JSON.parse(JSON.stringify(current)));
      }
    } catch (err) {
      console.error('Lỗi khi tải mẫu checklist phòng ban:', err);
      addToast({
        type: 'error',
        message: 'Không thể tải danh sách mẫu checklist. Đang dùng cấu hình mặc định.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeptId, addToast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Xử lý khi người dùng đổi phòng ban (AC 1)
  const handleSelectDepartment = (deptId: string) => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'Bạn có thay đổi chưa lưu trên mẫu checklist hiện tại. Bạn có chắc muốn đổi phòng ban không?'
      );
      if (!confirmLeave) return;
    }

    setSelectedDeptId(deptId);
    const target = departmentTemplates.find((t) => t.departmentId === deptId);
    if (target) {
      setCurrentTemplate(JSON.parse(JSON.stringify(target)));
      setIsDirty(false);
    }
  };

  // 4. Thao tác CRUD đầu việc mẫu (AC 2)
  const handleOpenAddItem = (phase?: OnboardingTaskPhase) => {
    setItemToEdit(null);
    if (phase) {
      setDefaultPhaseForNewItem(phase);
    }
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: OnboardingChecklistItem) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItemFromModal = (savedItem: OnboardingChecklistItem) => {
    setCurrentTemplate((prev) => {
      const existsIndex = prev.items.findIndex((item) => item.id === savedItem.id);
      let newItems: OnboardingChecklistItem[];

      if (existsIndex >= 0) {
        newItems = [...prev.items];
        newItems[existsIndex] = savedItem;
        addToast({
          type: 'success',
          message: `Đã cập nhật đầu việc "${savedItem.title}".`,
        });
      } else {
        newItems = [...prev.items, savedItem];
        addToast({
          type: 'success',
          message: `Đã thêm đầu việc mới "${savedItem.title}" vào mẫu.`,
        });
      }

      // Đánh số thứ tự lại
      newItems = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));

      return {
        ...prev,
        items: newItems,
      };
    });
    setIsDirty(true);
  };

  // Nhân bản đầu việc
  const handleDuplicateItem = (item: OnboardingChecklistItem) => {
    const duplicated: OnboardingChecklistItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${item.title} (Bản sao)`,
      order: item.order + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentTemplate((prev) => {
      const index = prev.items.findIndex((i) => i.id === item.id);
      const newItems = [...prev.items];
      newItems.splice(index + 1, 0, duplicated);

      return {
        ...prev,
        items: newItems.map((it, idx) => ({ ...it, order: idx + 1 })),
      };
    });

    setIsDirty(true);
    addToast({
      type: 'info',
      message: `Đã nhân bản đầu việc "${item.title}".`,
    });
  };

  // Xóa đầu việc
  const handleDeleteItem = (itemId: string, itemTitle: string) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      items: prev.items
        .filter((i) => i.id !== itemId)
        .map((it, idx) => ({ ...it, order: idx + 1 })),
    }));
    setIsDirty(true);
    addToast({
      type: 'info',
      message: `Đã xóa đầu việc "${itemTitle}".`,
    });
  };

  // Bật/tắt kích hoạt đầu việc (AC 3)
  const handleToggleItemActive = (itemId: string) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, isActive: !item.isActive } : item
      ),
    }));
    setIsDirty(true);
  };

  // Di chuyển thứ tự đầu việc lên/xuống (AC 3)
  const handleMoveItem = (itemId: string, direction: 'UP' | 'DOWN') => {
    setCurrentTemplate((prev) => ({
      ...prev,
      items: moveChecklistItem(prev.items, itemId, direction),
    }));
    setIsDirty(true);
  };

  // 5. Lưu mẫu checklist tổng thể qua API (AC 3)
  const handleSaveOverallTemplate = async () => {
    setIsSaving(true);
    try {
      const saved = await onboardingChecklistService.saveDepartmentTemplate(
        currentTemplate.departmentId,
        currentTemplate
      );

      // Cập nhật lại state danh sách phòng ban
      setDepartmentTemplates((prev) =>
        prev.map((t) => (t.departmentId === saved.departmentId ? saved : t))
      );
      setCurrentTemplate(saved);
      setIsDirty(false);

      addToast({
        type: 'success',
        message: `Đã lưu thành công mẫu checklist tiếp nhận phòng ban "${saved.departmentName}"!`,
      });

      if (onTemplateSaved) {
        onTemplateSaved(saved);
      }
    } catch (err) {
      console.error('Lỗi khi lưu mẫu checklist:', err);
      addToast({
        type: 'error',
        message: 'Đã xảy ra lỗi khi lưu mẫu checklist. Vui lòng thử lại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Khôi phục mẫu mặc định của phòng ban (AC 3)
  const handleResetToDefault = async () => {
    try {
      const restored = await onboardingChecklistService.resetDepartmentTemplateToDefault(
        selectedDeptId
      );
      setCurrentTemplate(restored);
      setDepartmentTemplates((prev) =>
        prev.map((t) => (t.departmentId === restored.departmentId ? restored : t))
      );
      setIsDirty(false);
      setShowResetConfirm(false);

      addToast({
        type: 'success',
        message: `Đã khôi phục mẫu mặc định chuẩn cho phòng ban "${restored.departmentName}".`,
      });
    } catch (err) {
      console.error('Lỗi khi reset mẫu:', err);
      addToast({
        type: 'error',
        message: 'Không thể khôi phục mẫu mặc định.',
      });
    }
  };

  // 6. Thống kê số liệu template (AC 1)
  const templateStats = useMemo(() => {
    return calculateTemplateStats(currentTemplate.items);
  }, [currentTemplate.items]);

  // Danh sách đầu việc sau khi lọc & tìm kiếm
  const filteredItems = useMemo(() => {
    return currentTemplate.items.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPhase = selectedPhaseFilter === 'ALL' || item.phase === selectedPhaseFilter;
      const matchesRole = selectedRoleFilter === 'ALL' || item.responsibleRole === selectedRoleFilter;

      return matchesSearch && matchesPhase && matchesRole;
    });
  }, [currentTemplate.items, searchQuery, selectedPhaseFilter, selectedRoleFilter]);

  // Nhóm đầu việc theo từng giai đoạn (Phase)
  const itemsGroupedByPhase = useMemo(() => {
    const groups: Record<OnboardingTaskPhase, OnboardingChecklistItem[]> = {
      PRE_BOARDING: [],
      DAY_ONE: [],
      FIRST_WEEK: [],
      FIRST_MONTH: [],
    };

    filteredItems.forEach((item) => {
      if (groups[item.phase]) {
        groups[item.phase].push(item);
      }
    });

    return groups;
  }, [filteredItems]);

  const togglePhaseExpand = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  if (isLoading) {
    return (
      <div
        data-testid="onboarding-template-loading"
        className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center"
      >
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Đang tải cấu hình mẫu checklist tiếp nhận nhân sự theo phòng ban...
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="onboarding-checklist-template-manager"
      className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6"
    >
      {/* 1. Header & Bộ chọn phòng ban (Department Selector - AC 1) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Mẫu Checklist tiếp nhận theo phòng ban</span>
                {isDirty && (
                  <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300">
                    Chưa lưu thay đổi
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cấu hình danh mục công việc bàn giao, người phụ trách và thời hạn SLA cho nhân sự mới
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Reset & Save Template (AC 3) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            data-testid="btn-reset-template"
            onClick={() => setShowResetConfirm(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-rose-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-rose-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Mặc định</span>
          </button>

          <button
            type="button"
            data-testid="btn-add-item-primary"
            onClick={() => handleOpenAddItem()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm đầu việc mẫu</span>
          </button>

          <button
            type="button"
            data-testid="btn-save-template"
            onClick={handleSaveOverallTemplate}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Lưu mẫu phòng ban</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Department Selector Cards / Tabs (AC 1) */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2.5 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Chọn phòng ban / bộ phận chuyên môn để thiết lập biểu mẫu:</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5" role="tablist">
          {departmentTemplates.map((dept) => {
            const isSelected = dept.departmentId === selectedDeptId;
            const count = dept.items.length;
            const activeCount = dept.items.filter((i) => i.isActive).length;

            return (
              <button
                key={dept.departmentId}
                type="button"
                data-testid={`dept-tab-${dept.departmentId}`}
                onClick={() => handleSelectDepartment(dept.departmentId)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-white ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50/80 text-gray-700 dark:border-gray-800 dark:bg-gray-850 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {dept.departmentCode}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {activeCount}/{count} việc
                  </span>
                </div>
                <span className="text-xs font-bold line-clamp-1">{dept.departmentName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. KPI Stats & Template Overview (AC 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tổng số đầu việc */}
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Tổng đầu việc mẫu</span>
            <CheckSquare className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span data-testid="stat-total-items" className="text-xl font-extrabold text-gray-900 dark:text-white">
              {templateStats.totalItems}
            </span>
            <span className="text-[11px] text-gray-500">nhiệm vụ</span>
          </div>
        </div>

        {/* Đang kích hoạt áp dụng */}
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Đang kích hoạt</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span data-testid="stat-active-items" className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {templateStats.activeItems}
            </span>
            <span className="text-[11px] text-gray-500">
              ({templateStats.totalItems > 0 ? Math.round((templateStats.activeItems / templateStats.totalItems) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Bắt buộc hoàn thành */}
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Bắt buộc hoàn thành</span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span data-testid="stat-required-items" className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {templateStats.requiredItems}
            </span>
            <span className="text-[11px] text-gray-500">nhiệm vụ cốt lõi</span>
          </div>
        </div>

        {/* Chu kỳ thời hạn SLA tối đa */}
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Chu kỳ SLA tối đa</span>
            <Clock className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span data-testid="stat-max-sla" className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400">
              {templateStats.maxSlaDays}
            </span>
            <span className="text-[11px] text-gray-500">ngày tiếp nhận</span>
          </div>
        </div>
      </div>

      {/* 4. Toolbar: Search, Filters, & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            data-testid="input-search-checklist"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên việc hoặc nhóm..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 pl-9 pr-3 text-xs text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Phase filter & Role filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Lọc:</span>
          </div>

          <select
            data-testid="select-filter-phase"
            value={selectedPhaseFilter}
            onChange={(e) => setSelectedPhaseFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white py-1.5 px-2.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="ALL">Tất cả giai đoạn</option>
            {ONBOARDING_PHASES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortLabel} ({p.label})
              </option>
            ))}
          </select>

          <select
            data-testid="select-filter-role"
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white py-1.5 px-2.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="ALL">Tất cả người phụ trách</option>
            {ONBOARDING_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Toggle View mode */}
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl p-0.5 bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              data-testid="btn-view-grouped"
              onClick={() => setViewMode('GROUPED')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'GROUPED'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Theo nhóm
            </button>
            <button
              type="button"
              data-testid="btn-view-table"
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Dạng bảng
            </button>
          </div>
        </div>
      </div>

      {/* 5. Main Content: Danh sách đầu việc mẫu (AC 1, AC 2, AC 3) */}
      {viewMode === 'GROUPED' ? (
        <div data-testid="grouped-checklist-view" className="space-y-4">
          {ONBOARDING_PHASES.map((phase) => {
            const phaseItems = itemsGroupedByPhase[phase.id] || [];
            if (selectedPhaseFilter !== 'ALL' && selectedPhaseFilter !== phase.id) {
              return null;
            }

            const isExpanded = expandedPhases[phase.id] ?? true;

            return (
              <div
                key={phase.id}
                data-testid={`phase-group-${phase.id}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden"
              >
                {/* Phase Header */}
                <div
                  onClick={() => togglePhaseExpand(phase.id)}
                  className={`flex items-center justify-between p-4 cursor-pointer border-l-4 ${phase.borderClass} hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${phase.badgeClass}`}>
                      {phase.shortLabel}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>{phase.label}</span>
                        <span className="text-xs font-semibold text-gray-400">
                          ({phaseItems.length} đầu việc)
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {phase.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid={`btn-add-item-phase-${phase.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddItem(phase.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Thêm việc</span>
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Phase Items List */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                    {phaseItems.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-400">
                        Chưa có đầu việc nào trong giai đoạn này.{' '}
                        <button
                          type="button"
                          onClick={() => handleOpenAddItem(phase.id)}
                          className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                        >
                          Thêm ngay
                        </button>
                      </div>
                    ) : (
                      phaseItems.map((item, idx) => (
                        <ChecklistRowItem
                          key={item.id}
                          item={item}
                          index={idx}
                          isFirst={idx === 0}
                          isLast={idx === phaseItems.length - 1}
                          onToggleActive={handleToggleItemActive}
                          onEdit={handleOpenEditItem}
                          onDelete={handleDeleteItem}
                          onDuplicate={handleDuplicateItem}
                          onMove={handleMoveItem}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Dạng Bảng Tổng Hợp (Table View) */
        <div data-testid="table-checklist-view" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-3 w-16 text-center">Thứ tự</th>
                  <th className="py-3 px-3">Tên đầu việc & Hướng dẫn</th>
                  <th className="py-3 px-3 w-36">Giai đoạn</th>
                  <th className="py-3 px-3 w-36">Người phụ trách</th>
                  <th className="py-3 px-3 w-28 text-center">Thời hạn SLA</th>
                  <th className="py-3 px-3 w-24 text-center">Bắt buộc</th>
                  <th className="py-3 px-3 w-24 text-center">Kích hoạt</th>
                  <th className="py-3 px-3 w-28 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 text-xs">
                      Không tìm thấy đầu việc nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => (
                    <ChecklistTableRow
                      key={item.id}
                      item={item}
                      index={idx}
                      isFirst={idx === 0}
                      isLast={idx === filteredItems.length - 1}
                      onToggleActive={handleToggleItemActive}
                      onEdit={handleOpenEditItem}
                      onDelete={handleDeleteItem}
                      onDuplicate={handleDuplicateItem}
                      onMove={handleMoveItem}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Footer Notes */}
      <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40 text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
        <div className="space-y-0.5">
          <span className="font-bold">Cơ chế áp dụng mẫu tự động:</span>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
            Khi ứng viên chuyển sang trạng thái <strong>Nhận việc (Hired)</strong> và được phân vào phòng ban tương ứng, hệ thống sẽ tự động nhân bản danh mục các đầu việc đang bật kích hoạt để giao việc cho HR, Quản lý trực tiếp và nhân sự mới.
          </p>
        </div>
      </div>

      {/* Modal Thêm / Chỉnh sửa đầu việc (AC 2) */}
      <ChecklistItemModal
        isOpen={isItemModalOpen}
        itemToEdit={itemToEdit}
        defaultPhase={defaultPhaseForNewItem}
        onClose={() => {
          setIsItemModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItemFromModal}
      />

      {/* Modal xác nhận Reset về mặc định */}
      {showResetConfirm && (
        <div
          data-testid="modal-reset-confirm"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Khôi phục mẫu mặc định?
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Toàn bộ các đầu việc tùy biến của phòng ban <strong>{currentTemplate.departmentName}</strong> sẽ được thiết lập lại theo tiêu chuẩn mặc định ban đầu. Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                data-testid="btn-cancel-reset"
                onClick={() => setShowResetConfirm(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                data-testid="btn-confirm-reset"
                onClick={handleResetToDefault}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: ChecklistRowItem (Dạng Grouped Card)
// ==========================================
interface ChecklistRowItemProps {
  item: OnboardingChecklistItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onToggleActive: (id: string) => void;
  onEdit: (item: OnboardingChecklistItem) => void;
  onDelete: (id: string, title: string) => void;
  onDuplicate: (item: OnboardingChecklistItem) => void;
  onMove: (id: string, direction: 'UP' | 'DOWN') => void;
}

const ChecklistRowItem: React.FC<ChecklistRowItemProps> = ({
  item,
  index,
  isFirst,
  isLast,
  onToggleActive,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
}) => {
  const roleConfig = getRoleConfig(item.responsibleRole);

  return (
    <div
      data-testid={`checklist-item-row-${item.id}`}
      className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
        item.isActive
          ? 'bg-white hover:bg-gray-50/60 dark:bg-gray-900 dark:hover:bg-gray-850/60'
          : 'bg-gray-50/50 hover:bg-gray-100/50 dark:bg-gray-900/50 opacity-70'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Nút di chuyển thứ tự (Reorder AC 3) */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
          <button
            type="button"
            data-testid={`btn-move-up-${item.id}`}
            disabled={isFirst}
            onClick={() => onMove(item.id, 'UP')}
            className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 disabled:opacity-20 cursor-pointer"
            aria-label="Di chuyển lên"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] font-bold text-gray-400">{index + 1}</span>
          <button
            type="button"
            data-testid={`btn-move-down-${item.id}`}
            disabled={isLast}
            onClick={() => onMove(item.id, 'DOWN')}
            className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 disabled:opacity-20 cursor-pointer"
            aria-label="Di chuyển xuống"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Thông tin đầu việc */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold ${
                item.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 line-through'
              }`}
            >
              {item.title}
            </span>

            {item.isRequired && (
              <span className="inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                Bắt buộc
              </span>
            )}

            {item.category && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {item.category}
              </span>
            )}
          </div>

          {item.description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Badges: Người phụ trách & SLA */}
          <div className="mt-2 flex items-center gap-2.5 flex-wrap text-xs">
            {/* Vai trò phụ trách */}
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${roleConfig.badgeClass}`}>
              <User className="h-3 w-3" />
              <span>{roleConfig.label}</span>
            </span>

            {/* Thời hạn SLA */}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
              <Clock className="h-3 w-3 text-cyan-500" />
              <span>SLA: {item.dueDays} ngày</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons & Toggle switch (AC 3) */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {/* Toggle Active Switch */}
        <label
          className="flex items-center gap-1.5 cursor-pointer mr-1"
          title={item.isActive ? 'Đang kích hoạt' : 'Đang tạm dừng'}
        >
          <input
            type="checkbox"
            data-testid={`toggle-active-${item.id}`}
            checked={item.isActive}
            onChange={() => onToggleActive(item.id)}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span className="text-[11px] font-medium text-gray-500 hidden sm:inline">
            {item.isActive ? 'Áp dụng' : 'Tắt'}
          </span>
        </label>

        {/* Nút sửa */}
        <button
          type="button"
          data-testid={`btn-edit-item-${item.id}`}
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 cursor-pointer"
          aria-label="Chỉnh sửa"
        >
          <Edit2 className="h-4 w-4" />
        </button>

        {/* Nút nhân bản */}
        <button
          type="button"
          data-testid={`btn-duplicate-item-${item.id}`}
          onClick={() => onDuplicate(item)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 cursor-pointer"
          aria-label="Nhân bản"
        >
          <Copy className="h-4 w-4" />
        </button>

        {/* Nút xóa */}
        <button
          type="button"
          data-testid={`btn-delete-item-${item.id}`}
          onClick={() => onDelete(item.id, item.title)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-gray-800 cursor-pointer"
          aria-label="Xóa"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: ChecklistTableRow (Dạng Bảng Table)
// ==========================================
const ChecklistTableRow: React.FC<ChecklistRowItemProps> = ({
  item,
  index,
  isFirst,
  isLast,
  onToggleActive,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
}) => {
  const phaseConfig = getPhaseConfig(item.phase);
  const roleConfig = getRoleConfig(item.responsibleRole);

  return (
    <tr
      data-testid={`checklist-table-row-${item.id}`}
      className={`hover:bg-gray-50/60 dark:hover:bg-gray-850/60 transition-colors ${
        !item.isActive ? 'opacity-60 bg-gray-50/30' : ''
      }`}
    >
      {/* Thứ tự & nút di chuyển */}
      <td className="py-2.5 px-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onMove(item.id, 'UP')}
            className="p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <span className="font-bold text-gray-500">{index + 1}</span>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMove(item.id, 'DOWN')}
            className="p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
      </td>

      {/* Tên việc & Mô tả */}
      <td className="py-2.5 px-3">
        <div className="font-bold text-gray-900 dark:text-white line-clamp-1">
          {item.title}
        </div>
        {item.description && (
          <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
            {item.description}
          </div>
        )}
      </td>

      {/* Giai đoạn */}
      <td className="py-2.5 px-3">
        <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold ${phaseConfig.badgeClass}`}>
          {phaseConfig.shortLabel}
        </span>
      </td>

      {/* Vai trò phụ trách */}
      <td className="py-2.5 px-3">
        <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold ${roleConfig.badgeClass}`}>
          {roleConfig.label}
        </span>
      </td>

      {/* Thời hạn SLA */}
      <td className="py-2.5 px-3 text-center font-semibold text-gray-700 dark:text-gray-300">
        {item.dueDays} ngày
      </td>

      {/* Bắt buộc */}
      <td className="py-2.5 px-3 text-center">
        {item.isRequired ? (
          <span className="inline-block px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
            Bắt buộc
          </span>
        ) : (
          <span className="text-gray-400 text-[11px]">Tùy chọn</span>
        )}
      </td>

      {/* Kích hoạt */}
      <td className="py-2.5 px-3 text-center">
        <input
          type="checkbox"
          checked={item.isActive}
          onChange={() => onToggleActive(item.id)}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
        />
      </td>

      {/* Thao tác */}
      <td className="py-2.5 px-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-1 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            title="Chỉnh sửa"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(item)}
            className="p-1 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            title="Nhân bản"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id, item.title)}
            className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            title="Xóa"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default OnboardingChecklistTemplateManager;
