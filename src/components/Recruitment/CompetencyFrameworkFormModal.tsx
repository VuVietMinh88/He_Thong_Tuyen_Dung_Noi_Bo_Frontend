import { useState, useEffect, type FC, type FormEvent } from 'react';
import {
  businessService,
  type Position,
} from '../../services/business.service';

import {
  competencyService,
  type CompetencyFramework,
} from '../../services/competencyService';

import {
  calculateTotalWeight,
  isWeightValid,
  type CompetencyFrameworkFormData,
  type CriterionFormData,
} from './competencyFramework.types';
import CriterionWeightManager from './CriterionWeightManager';

interface CompetencyFrameworkFormModalProps {
  isOpen: boolean;
  frameworkId?: string | null;
  onClose: () => void;
  onSuccess: (framework: CompetencyFramework) => void;
}

const createEmptyCriterion = (index: number): CriterionFormData => ({
  tempId: `criterion-${Date.now()}-${index}`,
  name: '',
  description: '',
  weight: '',
});

export const CompetencyFrameworkFormModal: FC<CompetencyFrameworkFormModalProps> = ({
  isOpen,
  frameworkId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CompetencyFrameworkFormData>({
    code: '',
    name: '',
    description: '',
    status: 'ACTIVE',
    criteria: [createEmptyCriterion(1), createEmptyCriterion(2)],
    assignedPositionIds: [],
  });

  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [positionSearchTerm, setPositionSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tải dữ liệu ban đầu khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage('');

    const loadInitialData = async () => {
      try {
        const positionsResponse = await businessService.getPositions(0);
        if (isMounted) {
          setAvailablePositions(positionsResponse.items);
        }

        if (frameworkId) {
          const frameworkData = await competencyService.getFrameworkById(frameworkId);
          if (isMounted) {

            const currentPositionIds = frameworkData.positions.map((pos) => pos.id);
            setFormData({
              id: frameworkData.id,
              code: frameworkData.code,
              name: frameworkData.name,
              description: frameworkData.description ?? '',
              status: frameworkData.status,
              criteria: frameworkData.criteria.map((criterion, index) => ({
                tempId: criterion.id || `crit-${index}`,
                id: criterion.id,
                name: criterion.name,
                description: criterion.description ?? '',
                weight: criterion.weight,
              })),
              assignedPositionIds: currentPositionIds,
            });
          }
        } else {
          // Tạo mới
          if (isMounted) {
            setFormData({

              code: '',
              name: '',
              description: '',
              status: 'ACTIVE',
              criteria: [
                {
                  tempId: `crit-1`,
                  name: 'Chuyên môn kỹ thuật',
                  description: 'Kiến thức cốt lõi, giải quyết vấn đề và chất lượng công việc',
                  weight: 50,
                },
                {
                  tempId: `crit-2`,
                  name: 'Kỹ năng mềm & Tinh thần đồng đội',
                  description: 'Giao tiếp, phối hợp liên phòng ban và tinh thần trách nhiệm',
                  weight: 50,
                },
              ],
              assignedPositionIds: [],
            });
          }
        }
      } catch (loadError: unknown) {
        if (isMounted) {
          setErrorMessage(
            loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu khung năng lực.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, frameworkId]);

  // Tính tổng trọng số real-time
  const totalWeight = calculateTotalWeight(formData.criteria);
  const isValidWeight = isWeightValid(totalWeight);

  // Thao tác chọn / gỡ chức danh
  const handleTogglePosition = (positionId: string) => {

    setFormData((prev) => {
      const isSelected = prev.assignedPositionIds.includes(positionId);
      const nextPositionIds = isSelected
        ? prev.assignedPositionIds.filter((id) => id !== positionId)
        : [...prev.assignedPositionIds, positionId];
      return {
        ...prev,
        assignedPositionIds: nextPositionIds,
      };
    });
  };

  // Lọc chức danh theo từ khóa
  const filteredPositions = availablePositions.filter((pos) => {
    const term = positionSearchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      pos.name.toLowerCase().includes(term) ||
      pos.code.toLowerCase().includes(term) ||
      pos.level.toLowerCase().includes(term)
    );
  });

  // Submit form với ràng buộc 100% trọng số
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    // Kiểm tra ràng buộc bắt buộc 100% trọng số
    if (!isValidWeight) {
      setErrorMessage(
        `Ràng buộc không hợp lệ: Tổng trọng số hiện tại là ${totalWeight}%. Tổng trọng số của tất cả các tiêu chí phải đạt chính xác đúng 100% trước khi lưu!`,
      );
      return;
    }

    // Kiểm tra tiêu chí không được để trống
    const emptyNameIndex = formData.criteria.findIndex((c) => !c.name.trim());
    if (emptyNameIndex !== -1) {
      setErrorMessage(`Tiêu chí số #${emptyNameIndex + 1} chưa có tên. Vui lòng nhập tên tiêu chí.`);
      return;
    }

    // Kiểm tra trọng số của từng tiêu chí phải > 0
    const invalidWeightItem = formData.criteria.findIndex(
      (c) => Number(c.weight) <= 0 || isNaN(Number(c.weight)),
    );
    if (invalidWeightItem !== -1) {
      setErrorMessage(
        `Tiêu chí số #${invalidWeightItem + 1} có trọng số không hợp lệ. Trọng số mỗi tiêu chí phải lớn hơn 0%.`,
      );
      return;
    }

    setIsSaving(true);

    try {
      const savedFramework = await competencyService.saveCompetencyFramework({
        id: formData.id ?? null,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        criteria: formData.criteria.map((c) => ({
          ...(c.id ? { id: c.id } : {}),
          name: c.name.trim(),
          description: c.description.trim() || null,
          weight: Number(c.weight),
        })),
        positionIds: formData.assignedPositionIds,
      });

      onSuccess(savedFramework);
      onClose();
    } catch (saveError: unknown) {
      setErrorMessage(
        saveError instanceof Error ? saveError.message : 'Không thể lưu khung năng lực.',
      );
    } finally {
      setIsSaving(false);
    }

  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="modal-title" className="text-xl font-bold text-slate-900">
              {formData.id ? 'Chỉnh sửa Khung năng lực' : 'Tạo mới Khung năng lực'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Thiết lập bộ tiêu chí đánh giá, phân bổ trọng số (bắt buộc đúng 100%) và chức danh áp dụng.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-hidden"
            aria-label="Đóng modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form id="competency-framework-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center space-x-2 text-slate-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span>Đang tải thông tin khung năng lực...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Thông báo lỗi nếu có */}
              {errorMessage && (
                <div
                  className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
                  role="alert"
                >
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <span className="font-semibold">Lưu ý: </span>
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Phần 1: Thông tin cơ bản */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-800 uppercase tracking-wider">
                  1. Thông tin chung
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="framework-code" className="block text-xs font-semibold text-slate-700">
                      Mã khung năng lực <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="framework-code"
                      type="text"
                      required
                      maxLength={50}
                      placeholder="VD: FRAMEWORK_DEV_SR"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 uppercase focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="framework-status" className="block text-xs font-semibold text-slate-700">
                      Trạng thái áp dụng <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="framework-status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as 'DRAFT' | 'ACTIVE',
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ACTIVE">🟢 Đang áp dụng (ACTIVE)</option>
                      <option value="DRAFT">🟡 Bản nháp (DRAFT)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="framework-name" className="block text-xs font-semibold text-slate-700">
                      Tên khung năng lực <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="framework-name"
                      type="text"
                      required
                      maxLength={255}
                      placeholder="VD: Khung năng lực Kỹ sư Phát triển Phần mềm Cao cấp"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="framework-desc" className="block text-xs font-semibold text-slate-700">
                      Mô tả chi tiết / Mục tiêu đánh giá
                    </label>
                    <textarea
                      id="framework-desc"
                      rows={2}
                      maxLength={1000}
                      placeholder="Mô tả mục đích áp dụng của bộ tiêu chí này..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Phần 2: Chức danh áp dụng (AC3) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                    2. Chức danh áp dụng ({formData.assignedPositionIds.length} đã chọn)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Khung năng lực có thể tái sử dụng cho nhiều chức danh
                  </span>
                </div>

                {/* Tìm kiếm chức danh */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Tìm kiếm chức danh theo tên, mã hoặc cấp bậc..."
                    value={positionSearchTerm}
                    onChange={(e) => setPositionSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-3 pl-9 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <svg
                    className="absolute top-2 left-2.5 h-4 w-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Danh sách chức danh cuộn */}
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                  {filteredPositions.length === 0 ? (
                    <p className="py-2 text-center text-xs text-slate-400">
                      {availablePositions.length === 0
                        ? 'Chưa có chức danh nào trong hệ thống.'
                        : 'Không tìm thấy chức danh phù hợp.'}
                    </p>
                  ) : (
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {filteredPositions.map((pos) => {
                        const isChecked = formData.assignedPositionIds.includes(pos.id);
                        return (
                          <label
                            key={pos.id}
                            className={`flex cursor-pointer items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                              isChecked
                                ? 'border-indigo-300 bg-indigo-50/70 text-indigo-900 font-medium'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePosition(pos.id)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate">{pos.name}</span>
                            </div>
                            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                              {pos.level || pos.code}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Phần 3: Quản lý tiêu chí & Trọng số (AC1 & AC2) */}
              <CriterionWeightManager
                criteria={formData.criteria}
                onChange={(nextCriteria) =>
                  setFormData((prev) => ({ ...prev, criteria: nextCriteria }))
                }
                disabled={isSaving}
              />
            </div>

          )}
        </form>

        {/* Modal Footer / Form Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-2xl">
          <div className="text-xs text-slate-500">
            {!isValidWeight && (
              <span className="font-semibold text-rose-600">
                ⚠️ Không thể lưu: Tổng trọng số chưa đạt 100%
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="competency-framework-form"
              disabled={isSaving || !isValidWeight}
              data-testid="submit-framework-btn"
              className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-xs transition-all ${
                !isValidWeight
                  ? 'cursor-not-allowed bg-slate-400 opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Lưu khung năng lực</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetencyFrameworkFormModal;
