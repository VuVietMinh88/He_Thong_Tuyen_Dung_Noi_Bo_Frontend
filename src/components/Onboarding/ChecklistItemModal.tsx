import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Edit3,
  Calendar,
  Clock,
  User,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type {
  OnboardingChecklistItem,
  OnboardingTaskPhase,
  OnboardingResponsibleRole,
  ChecklistItemValidationErrors,
} from '../../types/onboardingChecklist';
import { ONBOARDING_PHASES, ONBOARDING_ROLES } from '../../types/onboardingChecklist';
import { validateChecklistItem } from '../../utils/onboardingChecklistHelper';

export interface ChecklistItemModalProps {
  isOpen: boolean;
  itemToEdit?: OnboardingChecklistItem | null;
  defaultPhase?: OnboardingTaskPhase;
  onClose: () => void;
  onSave: (item: OnboardingChecklistItem) => void;
}

export const ChecklistItemModal: React.FC<ChecklistItemModalProps> = ({
  isOpen,
  itemToEdit,
  defaultPhase = 'PRE_BOARDING',
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(itemToEdit);

  const [title, setTitle] = useState<string>(() => itemToEdit?.title || '');
  const [description, setDescription] = useState<string>(() => itemToEdit?.description || '');
  const [phase, setPhase] = useState<OnboardingTaskPhase>(() => itemToEdit?.phase || defaultPhase);
  const [responsibleRole, setResponsibleRole] = useState<OnboardingResponsibleRole>(
    () => itemToEdit?.responsibleRole || 'HR'
  );
  const [dueDays, setDueDays] = useState<number>(() => itemToEdit?.dueDays || 1);
  const [isRequired, setIsRequired] = useState<boolean>(() => itemToEdit?.isRequired ?? true);
  const [isActive, setIsActive] = useState<boolean>(() => itemToEdit?.isActive ?? true);
  const [category, setCategory] = useState<string>(() => itemToEdit?.category || 'Quy trình chung');
  const [errors, setErrors] = useState<ChecklistItemValidationErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setTitle(itemToEdit.title);
        setDescription(itemToEdit.description || '');
        setPhase(itemToEdit.phase);
        setResponsibleRole(itemToEdit.responsibleRole);
        setDueDays(itemToEdit.dueDays);
        setIsRequired(itemToEdit.isRequired);
        setIsActive(itemToEdit.isActive);
        setCategory(itemToEdit.category || 'Quy trình chung');
      } else {
        setTitle('');
        setDescription('');
        setPhase(defaultPhase);
        setResponsibleRole('HR');
        setDueDays(1);
        setIsRequired(true);
        setIsActive(true);
        setCategory('Quy trình chung');
      }
      setErrors({});
    }
  }, [isOpen, itemToEdit, defaultPhase]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const candidateData: Partial<OnboardingChecklistItem> = {
      title,
      description,
      phase,
      responsibleRole,
      dueDays,
      isRequired,
      isActive,
      category,
    };

    const validation = validateChecklistItem(candidateData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    const savedItem: OnboardingChecklistItem = {
      id: itemToEdit?.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim(),
      phase,
      responsibleRole,
      dueDays: Number(dueDays),
      isRequired,
      isActive,
      order: itemToEdit?.order || 999,
      category: category.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: itemToEdit?.createdAt || new Date().toISOString(),
    };

    onSave(savedItem);
    onClose();
  };

  return (
    <div
      data-testid="checklist-item-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isEditing
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
              }`}
            >
              {isEditing ? <Edit3 className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Chỉnh sửa đầu việc mẫu' : 'Thêm đầu việc mẫu mới'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thiết lập thông tin, giai đoạn, vai trò phụ trách và thời hạn SLA
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-close-item-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Tên công việc (Title) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Tên công việc / Đầu việc mẫu *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                data-testid="input-item-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="VD: Cấp phát máy tính và phụ kiện, Ký HĐLĐ..."
                className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs text-gray-900 focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                  errors.title
                    ? 'border-rose-400 focus:ring-rose-500/20'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700'
                }`}
              />
            </div>
            {errors.title && (
              <p data-testid="error-item-title" className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Nhóm nhiệm vụ (Phase) & Vai trò phụ trách (Role) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nhóm nhiệm vụ (Giai đoạn tiếp nhận) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Nhóm nhiệm vụ / Giai đoạn *
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  data-testid="select-item-phase"
                  value={phase}
                  onChange={(e) => {
                    setPhase(e.target.value as OnboardingTaskPhase);
                    if (errors.phase) setErrors((prev) => ({ ...prev, phase: undefined }));
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {ONBOARDING_PHASES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({p.shortLabel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vai trò phụ trách mặc định */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Vai trò phụ trách mặc định *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  data-testid="select-item-role"
                  value={responsibleRole}
                  onChange={(e) => {
                    setResponsibleRole(e.target.value as OnboardingResponsibleRole);
                    if (errors.responsibleRole) setErrors((prev) => ({ ...prev, responsibleRole: undefined }));
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {ONBOARDING_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Thời hạn SLA hoàn thành (Due Days) & Nhóm công việc (Category) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Thời hạn quy định (SLA) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Thời hạn quy định SLA (Số ngày) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  data-testid="input-item-due-days"
                  min={1}
                  max={180}
                  value={dueDays}
                  onChange={(e) => {
                    setDueDays(Number(e.target.value));
                    if (errors.dueDays) setErrors((prev) => ({ ...prev, dueDays: undefined }));
                  }}
                  className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs text-gray-900 focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                    errors.dueDays
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700'
                  }`}
                />
              </div>
              {errors.dueDays && (
                <p data-testid="error-item-due-days" className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{errors.dueDays}</span>
                </p>
              )}
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                {dueDays <= 1 ? 'Hoàn thành trong 24 giờ kể từ thời điểm phân công' : `Hoàn thành tối đa trong vòng ${dueDays} ngày`}
              </p>
            </div>

            {/* Phân loại công việc */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Nhóm nghiệp vụ / Phân loại
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  data-testid="input-item-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="VD: Thiết bị & Công cụ, Hồ sơ pháp lý..."
                  className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Mô tả hướng dẫn chi tiết (Description) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Mô tả hướng dẫn thực hiện chi tiết
            </label>
            <textarea
              rows={3}
              data-testid="textarea-item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập hướng dẫn cụ thể, link tài liệu hoặc yêu cầu đầu ra để người thực hiện nắm rõ..."
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Tùy chọn Bắt buộc & Kích hoạt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            {/* Checkbox Bắt buộc hoàn thành */}
            <label className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
              <input
                type="checkbox"
                data-testid="checkbox-item-required"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-gray-800 dark:text-gray-200">Bắt buộc hoàn thành</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Tiêu chí để hoàn tất giai đoạn tiếp nhận</p>
              </div>
            </label>

            {/* Checkbox Trạng thái kích hoạt */}
            <label className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
              <input
                type="checkbox"
                data-testid="checkbox-item-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-gray-800 dark:text-gray-200">Kích hoạt áp dụng</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Tự động sinh khi có nhân sự mới phòng ban</p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              data-testid="btn-cancel-item-modal"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              data-testid="btn-save-item-modal"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isEditing ? 'Cập nhật đầu việc' : 'Thêm vào danh sách mẫu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChecklistItemModal;
