import React, { useState, useEffect, useId } from 'react';
import {
  X,
  FolderHeart,
  Users,
  Tag,
  FileText,
  Clock,
  Plus,
  Loader2,
  AlertCircle,
  Briefcase,
  Mail,
  Check,
  Sparkles,
} from 'lucide-react';
import type { CandidateProfile } from '../../types/candidate';
import type { TalentPoolCategory } from '../../types/talentPool';
import {
  DEFAULT_TALENT_POOL_CATEGORIES,
  SUGGESTED_TALENT_TAGS,
  CONTACT_TIMELINE_OPTIONS,
} from '../../types/talentPool';
import { talentPoolService } from '../../services/talentPoolService';
import { toast } from '../notifications';

export interface AddToTalentPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateProfile[];
  onSuccess?: (payload: {
    candidateIds: string[];
    category: string;
    tags: string[];
    notes: string;
    contactRecommendation?: string;
  }) => void;
  availableCategories?: TalentPoolCategory[];
}

export const AddToTalentPoolModal: React.FC<AddToTalentPoolModalProps> = ({
  isOpen,
  onClose,
  candidates: initialCandidates,
  onSuccess,
  availableCategories,
}) => {
  const categorySelectId = useId();
  const customCategoryInputId = useId();
  const tagInputId = useId();
  const notesTextareaId = useId();
  const contactTimelineInputId = useId();

  // Danh sách ứng viên được chọn (cho phép xóa bớt ứng viên trong chế độ Bulk Action)
  const [selectedCandidates, setSelectedCandidates] = useState<CandidateProfile[]>(
    () => initialCandidates || []
  );

  // Danh sách danh mục nhóm kho tiềm năng
  const [categories, setCategories] = useState<TalentPoolCategory[]>(
    availableCategories || DEFAULT_TALENT_POOL_CATEGORIES
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');

  // Danh sách tags / kỹ năng / ưu điểm dạng chips
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState<string>('');

  // Ghi chú & Thời điểm liên hệ lại
  const [notes, setNotes] = useState<string>('');
  const [contactRecommendation, setContactRecommendation] = useState<string>('Sau 3 tháng');

  // Trạng thái xử lý & Lỗi validation
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Đồng bộ lại danh sách ứng viên khi modal mở ra
  useEffect(() => {
    if (isOpen) {
      setSelectedCandidates(initialCandidates || []);
      setCategoryError(null);
      setIsSubmitting(false);

      // Tự động load danh mục từ service nếu chưa có
      talentPoolService.getCategories().then((loadedCats) => {
        if (loadedCats && loadedCats.length > 0) {
          setCategories(loadedCats);
        }
      });
    }
  }, [isOpen, initialCandidates]);

  if (!isOpen) return null;

  const isBulk = selectedCandidates.length > 1;

  // Xóa bớt ứng viên khỏi danh sách bulk
  const handleRemoveCandidate = (candidateId: string) => {
    setSelectedCandidates((prev) => prev.filter((c) => c.id !== candidateId));
  };

  // Thêm tag từ input
  const handleAddTag = () => {
    const trimmed = currentTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setCurrentTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Gỡ tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Chọn tag gợi ý nhanh
  const handleToggleSuggestedTag = (suggestedTag: string) => {
    if (tags.includes(suggestedTag)) {
      handleRemoveTag(suggestedTag);
    } else {
      setTags((prev) => [...prev, suggestedTag]);
    }
  };

  // Tạo nhóm mới nhanh
  const handleCreateCustomCategory = async () => {
    const trimmed = customCategoryName.trim();
    if (!trimmed) return;

    try {
      const created = await talentPoolService.createCategory(trimmed);
      setCategories((prev) => {
        if (prev.some((c) => c.name.toLowerCase() === created.name.toLowerCase())) {
          return prev;
        }
        return [...prev, created];
      });
      setSelectedCategory(created.name);
      setCustomCategoryName('');
      setIsAddingCustomCategory(false);
      setCategoryError(null);
      toast.success(`Đã tạo nhóm kho "${created.name}"`);
    } catch {
      toast.error('Không thể tạo nhóm kho mới');
    }
  };

  // Xác nhận chuyển ứng viên vào kho tiềm năng
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCandidates.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ứng viên.');
      return;
    }

    const finalCategory = isAddingCustomCategory
      ? customCategoryName.trim()
      : selectedCategory.trim();

    if (!finalCategory) {
      setCategoryError('Vui lòng chọn hoặc nhập nhóm kho tiềm năng');
      return;
    }

    setCategoryError(null);
    setIsSubmitting(true);

    try {
      const candidateIds = selectedCandidates.map((c) => c.id);
      await talentPoolService.addToTalentPool({
        candidateIds,
        category: finalCategory,
        tags,
        notes: notes.trim(),
        contactRecommendation: contactRecommendation.trim(),
      });

      toast.success(
        isBulk
          ? `Đã chuyển ${selectedCandidates.length} ứng viên vào kho "${finalCategory}"`
          : `Đã chuyển ứng viên ${selectedCandidates[0]?.fullName} vào kho "${finalCategory}"`
      );

      if (onSuccess) {
        onSuccess({
          candidateIds,
          category: finalCategory,
          tags,
          notes: notes.trim(),
          contactRecommendation: contactRecommendation.trim(),
        });
      }

      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu vào kho tiềm năng';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-to-talent-pool-title"
      data-testid="add-to-talent-pool-modal"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 sm:my-8">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <FolderHeart className="h-6 w-6" />
            </div>
            <div>
              <h3
                id="add-to-talent-pool-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Chuyển vào Kho ứng viên tiềm năng
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Lưu trữ hồ sơ chất lượng để tái sử dụng và liên hệ cho các đợt tuyển dụng sau
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-talent-pool-modal-btn"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* AC 1: Hiển thị tóm tắt danh sách ứng viên (Đơn lẻ hoặc Bulk) */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>{`Ứng viên được chọn (${selectedCandidates.length})`}</span>
              </div>
              {isBulk && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  Thao tác hàng loạt (Bulk Action)
                </span>
              )}
            </div>

            {selectedCandidates.length === 0 ? (
              <div className="flex items-center justify-center p-4 text-xs text-amber-600 bg-amber-50 rounded-lg dark:bg-amber-950/40 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 mr-1.5 shrink-0" />
                Chưa có ứng viên nào được chọn.
              </div>
            ) : selectedCandidates.length === 1 ? (
              // Chế độ 1 ứng viên: Card chi tiết
              (() => {
                const candidate = selectedCandidates[0];
                const initials = candidate.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(-2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    data-testid={`single-candidate-summary-${candidate.id}`}
                    className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200/70 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 font-bold text-indigo-700 text-xs dark:from-indigo-900 dark:to-indigo-950 dark:text-indigo-200">
                        {initials || 'UV'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{candidate.fullName}</span>
                          {candidate.trackingCode && (
                            <span className="font-mono text-[10px] font-normal text-slate-400">
                              #{candidate.trackingCode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3 text-slate-400" />
                            {candidate.appliedJobTitle || 'Chưa xác định vị trí'}
                          </span>
                          {candidate.email && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {candidate.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {candidate.departmentName && (
                      <span className="text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
                        {candidate.departmentName}
                      </span>
                    )}
                  </div>
                );
              })()
            ) : (
              // Chế độ nhiều ứng viên (Bulk Action): Danh sách cuộn dạng thẻ kèm nút gỡ [x]
              <div
                data-testid="bulk-candidates-list"
                className="max-h-36 overflow-y-auto space-y-1.5 pr-1"
              >
                {selectedCandidates.map((candidate) => {
                  const initials = candidate.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={candidate.id}
                      data-testid={`bulk-candidate-item-${candidate.id}`}
                      className="group flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200/60 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-700 text-[10px] dark:bg-indigo-950 dark:text-indigo-300">
                          {initials || 'UV'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {candidate.fullName}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {candidate.appliedJobTitle || 'Chưa xác định vị trí'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        data-testid={`remove-candidate-btn-${candidate.id}`}
                        onClick={() => handleRemoveCandidate(candidate.id)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 transition-colors"
                        title="Bỏ chọn ứng viên này"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AC 2: Gắn nhóm & Thẻ phân loại (Talent Pool Categorization) */}
          <div className="space-y-4">
            {/* 2.1 Chọn Nhóm / Danh mục kho tiềm năng */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={isAddingCustomCategory ? customCategoryInputId : categorySelectId}
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  Nhóm kho tiềm năng <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  data-testid="toggle-custom-category-btn"
                  onClick={() => {
                    setIsAddingCustomCategory(!isAddingCustomCategory);
                    setCategoryError(null);
                  }}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  {isAddingCustomCategory ? 'Chọn từ danh sách có sẵn' : '+ Tạo nhóm mới'}
                </button>
              </div>

              {isAddingCustomCategory ? (
                <div className="flex gap-2">
                  <input
                    id={customCategoryInputId}
                    type="text"
                    data-testid="custom-category-input"
                    value={customCategoryName}
                    onChange={(e) => {
                      setCustomCategoryName(e.target.value);
                      if (categoryError) setCategoryError(null);
                    }}
                    placeholder="Nhập tên nhóm kho mới (ví dụ: Blockchain Lead, Golang Cloud...)"
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs text-slate-900 dark:text-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 ${
                      categoryError
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200 dark:border-slate-700'
                    }`}
                  />
                  <button
                    type="button"
                    data-testid="create-custom-category-btn"
                    onClick={handleCreateCustomCategory}
                    disabled={!customCategoryName.trim()}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Tạo & Chọn
                  </button>
                </div>
              ) : (
                <select
                  id={categorySelectId}
                  data-testid="talent-pool-category-select"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    if (categoryError) setCategoryError(null);
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-900 dark:text-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 ${
                    categoryError
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">-- Chọn nhóm kho tiềm năng phù hợp --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} {cat.candidateCount ? `(${cat.candidateCount} hồ sơ)` : ''}
                    </option>
                  ))}
                </select>
              )}

              {categoryError && (
                <p
                  data-testid="category-error-message"
                  className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400"
                >
                  <AlertCircle className="h-3 w-3" />
                  {categoryError}
                </p>
              )}
            </div>

            {/* 2.2 Ô nhập Tag kỹ năng / ưu điểm chính (Chips) */}
            <div>
              <label
                htmlFor={tagInputId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Gắn thẻ kỹ năng & ưu điểm nổi bật (Tags)
              </label>

              {/* Khung chứa các tag chips đã chọn & ô input */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-900/50">
                <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />

                {tags.map((tagItem) => (
                  <span
                    key={tagItem}
                    data-testid={`selected-tag-chip-${tagItem}`}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800"
                  >
                    <span>{tagItem}</span>
                    <button
                      type="button"
                      data-testid={`remove-tag-chip-${tagItem}`}
                      onClick={() => handleRemoveTag(tagItem)}
                      className="rounded-full hover:bg-indigo-200/60 p-0.5 dark:hover:bg-indigo-800 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                <input
                  id={tagInputId}
                  type="text"
                  data-testid="tag-input-field"
                  value={currentTagInput}
                  onChange={(e) => setCurrentTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? 'Nhập kỹ năng, bấm Enter để thêm (vd: React, English C1...)' : 'Thêm tag...'}
                  className="flex-1 min-w-[140px] bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden py-0.5"
                />

                {currentTagInput.trim() && (
                  <button
                    type="button"
                    data-testid="add-tag-btn"
                    onClick={handleAddTag}
                    className="rounded bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300"
                  >
                    <Plus className="h-3 w-3 inline mr-0.5" />
                    Thêm
                  </button>
                )}
              </div>

              {/* Gợi ý tag nhanh (Quick suggestions) */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Gợi ý nhanh:
                </span>
                {SUGGESTED_TALENT_TAGS.map((suggested) => {
                  const isSelected = tags.includes(suggested);
                  return (
                    <button
                      key={suggested}
                      type="button"
                      data-testid={`suggested-tag-btn-${suggested}`}
                      onClick={() => handleToggleSuggestedTag(suggested)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                      {suggested}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AC 3: Ghi chú đánh giá & Thời điểm nên liên hệ lại */}
          <div className="space-y-4 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* 3.1 Textarea ghi chú đánh giá */}
            <div>
              <label
                htmlFor={notesTextareaId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
              >
                Ghi chú & Đánh giá của Recruiter
              </label>
              <div className="relative">
                <textarea
                  id={notesTextareaId}
                  data-testid="recruiter-notes-textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhận xét ưu điểm nổi bật, lý do lưu kho (ví dụ: Chuyên môn tốt, tư duy logic vững, hiện tại chưa khớp mức lương hoặc vị trí tạm hoãn...)"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                />
                <FileText className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 3.2 Thời điểm thích hợp nên liên hệ lại */}
            <div>
              <label
                htmlFor={contactTimelineInputId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Thời điểm thích hợp nên liên hệ lại
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {CONTACT_TIMELINE_OPTIONS.map((timeline) => {
                  const isActive = contactRecommendation === timeline;
                  return (
                    <button
                      key={timeline}
                      type="button"
                      data-testid={`timeline-option-${timeline}`}
                      onClick={() => setContactRecommendation(timeline)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {timeline}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <input
                  id={contactTimelineInputId}
                  type="text"
                  data-testid="contact-recommendation-input"
                  value={contactRecommendation}
                  onChange={(e) => setContactRecommendation(e.target.value)}
                  placeholder="Hoặc nhập mốc thời gian cụ thể (ví dụ: Sau Tết 2027, Khi mở dự án FinTech...)"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                />
                <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* AC 4: Footer Modal & Validation/Loading UX */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selectedCandidates.length > 0 ? (
                <>
                  Chuẩn bị lưu{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {selectedCandidates.length} ứng viên
                  </strong>
                </>
              ) : (
                <span className="text-rose-500">Cần ít nhất 1 ứng viên</span>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="cancel-talent-pool-btn"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                data-testid="confirm-add-to-talent-pool-btn"
                disabled={isSubmitting || selectedCandidates.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang lưu vào kho...</span>
                  </>
                ) : (
                  <>
                    <FolderHeart className="h-3.5 w-3.5" />
                    <span>
                      {isBulk
                        ? `Lưu ${selectedCandidates.length} ứng viên vào kho`
                        : 'Lưu vào kho tiềm năng'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToTalentPoolModal;
