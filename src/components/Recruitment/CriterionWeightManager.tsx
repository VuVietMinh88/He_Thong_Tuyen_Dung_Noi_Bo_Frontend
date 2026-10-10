import { type FC, useId } from 'react';
import {
  calculateTotalWeight,
  distributeWeightsEqually,
  isWeightValid,
  type CriterionFormData,
} from './competencyFramework.types';

export interface CriterionWeightManagerProps {
  criteria: CriterionFormData[];
  onChange: (criteria: CriterionFormData[]) => void;
  disabled?: boolean;
  minCriteria?: number;
}

// Bảng màu phân bổ sinh động cho thanh phân bổ tổng thể
const CRITERION_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-orange-500',
];

export const CriterionWeightManager: FC<CriterionWeightManagerProps> = ({
  criteria,
  onChange,
  disabled = false,
  minCriteria = 1,
}) => {
  const componentId = useId();
  const totalWeight = calculateTotalWeight(criteria);
  const isValid = isWeightValid(totalWeight);

  // Thêm mới một dòng tiêu chí
  const handleAddCriterion = () => {
    const newCriterion: CriterionFormData = {
      tempId: `criterion-${Date.now()}-${criteria.length + 1}`,
      name: '',
      description: '',
      weight: '',
    };
    onChange([...criteria, newCriterion]);
  };

  // Cập nhật giá trị một trường của tiêu chí
  const handleUpdateCriterion = (
    index: number,
    field: keyof Omit<CriterionFormData, 'tempId' | 'id'>,
    value: string | number,
  ) => {
    const updated = criteria.map((item, idx) => {
      if (idx !== index) return item;
      return {
        ...item,
        [field]: value,
      };
    });
    onChange(updated);
  };

  // Tăng/giảm trọng số nhanh bằng stepper
  const handleStepWeight = (index: number, delta: number) => {
    const target = criteria[index];
    if (!target) return;
    const currentWeight = typeof target.weight === 'string'
      ? parseFloat(target.weight) || 0
      : target.weight;

    const newWeight = Math.min(100, Math.max(1, Math.round((currentWeight + delta) * 10) / 10));
    handleUpdateCriterion(index, 'weight', newWeight);
  };

  // Xóa một dòng tiêu chí
  const handleRemoveCriterion = (index: number) => {
    if (criteria.length <= minCriteria) return;
    const updated = criteria.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  // Tự động phân bổ đều 100% cho tất cả tiêu chí
  const handleDistributeEqually = () => {
    if (criteria.length === 0) return;
    const equalWeights = distributeWeightsEqually(criteria.length);
    const updated = criteria.map((item, idx) => ({
      ...item,
      weight: equalWeights[idx] ?? 0,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      {/* Header & Công cụ điều khiển */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Trọng số tiêu chí đánh giá
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Nhập trọng số từ 1% đến 100% cho mỗi tiêu chí. Tổng tất cả tiêu chí phải bằng 100%.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDistributeEqually}
            disabled={disabled || criteria.length === 0}
            title="Tự động chia đều 100% trọng số cho các tiêu chí"
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
          >
            <span>⚡</span> Chia đều 100%
          </button>
          <button
            type="button"
            onClick={handleAddCriterion}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
          >
            <span>+</span> Thêm tiêu chí
          </button>
        </div>
      </div>

      {/* Thanh hiển thị Tổng Trọng Số Tự Động (Real-time Calculation) - AC2 */}
      <div
        className={`rounded-xl border p-4 transition-colors duration-200 ${
          isValid
            ? 'border-emerald-300 bg-emerald-50/70'
            : 'border-rose-300 bg-rose-50/80'
        }`}
        data-testid="weight-status-container"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Chỉ số & Nhãn trạng thái */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Tổng trọng số:
            </span>
            <span
              className={`text-xl font-extrabold tracking-tight ${
                isValid ? 'text-emerald-700' : 'text-rose-700'
              }`}
              data-testid="total-weight-value"
            >
              {totalWeight.toFixed(1)}%
            </span>
          </div>

          {/* Badge trạng thái Hợp lệ (Xanh) / Không hợp lệ (Đỏ) */}
          <div>
            {isValid ? (
              <span
                data-testid="badge-valid"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-600/30"
              >
                <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Hợp lệ (Đúng 100%)
              </span>
            ) : (
              <span
                data-testid="badge-invalid"
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 ring-1 ring-rose-600/30"
              >
                <svg className="h-4 w-4 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {totalWeight > 100
                  ? `Vượt quá ${(totalWeight - 100).toFixed(1)}%`
                  : `Còn thiếu ${(100 - totalWeight).toFixed(1)}%`}
              </span>
            )}
          </div>
        </div>

        {/* Thanh Progress Bar toàn diện */}
        <div className="mt-3">
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={`h-full transition-all duration-300 ${
                isValid ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(totalWeight, 100)}%` }}
            />
          </div>
        </div>

        {/* Thanh phân bổ tỷ lệ màu sắc (Breakdown preview) */}
        {criteria.length > 0 && totalWeight > 0 && (
          <div className="mt-2">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50">
              {criteria.map((c, i) => {
                const w = typeof c.weight === 'string' ? parseFloat(c.weight) || 0 : c.weight;
                if (w <= 0) return null;
                const percentageOfTotal = Math.min(100, (w / (totalWeight || 1)) * 100);
                const colorClass = CRITERION_COLORS[i % CRITERION_COLORS.length];
                return (
                  <div
                    key={c.tempId || i}
                    className={`h-full ${colorClass}`}
                    style={{ width: `${percentageOfTotal}%` }}
                    title={`${c.name || `Tiêu chí #${i + 1}`}: ${w}%`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Cảnh báo chi tiết khi không đúng 100% */}
        {!isValid && (
          <p className="mt-2.5 text-xs text-rose-700" role="alert">
            <span className="font-semibold">⚠️ Cảnh báo: </span>
            {totalWeight > 100
              ? `Tổng trọng số đã vượt mốc 100%. Vui lòng giảm bớt ${(totalWeight - 100).toFixed(1)}% để hệ thống hợp lệ.`
              : `Tổng trọng số chưa đạt 100%. Vui lòng bổ sung thêm ${(100 - totalWeight).toFixed(1)}% cho các tiêu chí.`}
          </p>
        )}
      </div>

      {/* Giao diện dạng Lưới nhập trọng số chi tiết (Grid Layout) - AC1 & AC3 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Tiêu đề lưới cho Desktop/Tablet */}
        <div className="hidden grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600 sm:grid">
          <div className="col-span-1 text-center">STT</div>
          <div className="col-span-4">Tên tiêu chí đánh giá</div>
          <div className="col-span-4">Mô tả chi tiết / Tiêu chuẩn</div>
          <div className="col-span-2 text-center">Trọng số (%)</div>
          <div className="col-span-1 text-right">Xóa</div>
        </div>

        {/* Danh sách các dòng tiêu chí */}
        <div className="divide-y divide-slate-100">
          {criteria.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Chưa có tiêu chí nào. Nhấn <strong>"+ Thêm tiêu chí"</strong> để bắt đầu.
            </div>
          ) : (
            criteria.map((criterion, index) => {
              const numericWeight = typeof criterion.weight === 'string'
                ? parseFloat(criterion.weight) || 0
                : criterion.weight;
              const hasWeightError =
                criterion.weight !== '' && (numericWeight < 1 || numericWeight > 100);

              return (
                <div
                  key={criterion.tempId}
                  className="grid grid-cols-1 gap-3 p-4 transition-colors hover:bg-slate-50/60 sm:grid-cols-12 sm:items-center sm:px-4 sm:py-3"
                >
                  {/* Cột 1: STT & Badge số thứ tự */}
                  <div className="flex items-center justify-between sm:col-span-1 sm:justify-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 sm:hidden">
                      Tiêu chí #{index + 1}
                    </span>
                  </div>

                  {/* Cột 2: Tên tiêu chí */}
                  <div className="sm:col-span-4">
                    <label htmlFor={`${componentId}-name-${index}`} className="block text-[11px] font-medium text-slate-500 sm:hidden">
                      Tên tiêu chí *
                    </label>
                    <input
                      id={`${componentId}-name-${index}`}
                      type="text"
                      required
                      disabled={disabled}
                      placeholder="VD: Kỹ năng chuyên môn, Giao tiếp..."
                      value={criterion.name}
                      onChange={(e) => handleUpdateCriterion(index, 'name', e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Cột 3: Mô tả tiêu chí */}
                  <div className="sm:col-span-4">
                    <label htmlFor={`${componentId}-desc-${index}`} className="block text-[11px] font-medium text-slate-500 sm:hidden">
                      Mô tả tiêu chuẩn
                    </label>
                    <input
                      id={`${componentId}-desc-${index}`}
                      type="text"
                      disabled={disabled}
                      placeholder="Mô tả nội dung hoặc hướng dẫn chấm..."
                      value={criterion.description}
                      onChange={(e) => handleUpdateCriterion(index, 'description', e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Cột 4: Trường nhập trọng số chi tiết (AC1) có Stepper */}
                  <div className="sm:col-span-2">
                    <label htmlFor={`${componentId}-weight-${index}`} className="block text-[11px] font-medium text-slate-500 sm:hidden">
                      Trọng số % (1 - 100) *
                    </label>
                    <div className="mt-0.5 flex items-center">
                      {/* Nút giảm nhanh (-) */}
                      <button
                        type="button"
                        disabled={disabled || numericWeight <= 1}
                        onClick={() => handleStepWeight(index, -5)}
                        title="Giảm 5%"
                        className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40"
                      >
                        -
                      </button>

                      {/* Ô nhập số */}
                      <div className="relative flex-1">
                        <input
                          id={`${componentId}-weight-${index}`}
                          type="number"
                          required
                          min={1}
                          max={100}
                          step={0.5}
                          disabled={disabled}
                          placeholder="%"
                          value={criterion.weight}
                          onChange={(e) => handleUpdateCriterion(index, 'weight', e.target.value)}
                          className={`w-full border py-1.5 pr-6 pl-2.5 text-center text-xs font-bold text-slate-900 focus:ring-1 disabled:bg-slate-100 ${
                            hasWeightError
                              ? 'border-rose-400 bg-rose-50/50 text-rose-800 focus:border-rose-500 focus:ring-rose-500'
                              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                          }`}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-slate-400">
                          %
                        </span>
                      </div>

                      {/* Nút tăng nhanh (+) */}
                      <button
                        type="button"
                        disabled={disabled || numericWeight >= 100}
                        onClick={() => handleStepWeight(index, 5)}
                        title="Tăng 5%"
                        className="rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    {/* Báo lỗi nếu giá trị ngoài khoảng [1, 100] */}
                    {hasWeightError && (
                      <p className="mt-1 text-[10px] text-rose-600">
                        Giới hạn 1% - 100%
                      </p>
                    )}
                  </div>

                  {/* Cột 5: Nút xóa dòng */}
                  <div className="flex justify-end sm:col-span-1 sm:justify-end">
                    <button
                      type="button"
                      disabled={disabled || criteria.length <= minCriteria}
                      onClick={() => handleRemoveCriterion(index)}
                      title="Xóa tiêu chí này"
                      className="inline-flex items-center gap-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span className="text-xs sm:hidden">Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CriterionWeightManager;
