import React, { useState } from 'react';
import {
  Star,
  Tag,
  Plus,
  X,
  Lock,
  MessageSquare,
  Send,
  Loader2,
  Clock,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import type {
  CandidateTag,
  CandidateInternalNote,
  ScreeningCatalogTag,
} from '../../types/candidate';
import {
  MIN_STAR_RATING,
  MAX_STAR_RATING,
  STAR_RATING_DESCRIPTIONS,
  DEFAULT_SCREENING_CATALOG_TAGS,
} from '../../types/candidate';

export interface CandidateScreeningWidgetProps {
  candidateId?: string;
  candidateName?: string;
  candidateStarRating?: number;
  selectedScreeningTags?: CandidateTag[];
  internalNotes?: CandidateInternalNote[];
  catalogTags?: ScreeningCatalogTag[];
  currentUserName?: string;
  currentUserRole?: string;
  onRatingChange?: (selectedRating: number) => Promise<void> | void;
  onTagsChange?: (updatedTags: CandidateTag[]) => Promise<void> | void;
  onAddNote?: (
    noteContent: string,
    category?: CandidateInternalNote['category']
  ) => Promise<void> | void;
  isCompact?: boolean;
  className?: string;
}

export const CandidateScreeningWidget: React.FC<CandidateScreeningWidgetProps> = ({
  candidateStarRating = 0,
  selectedScreeningTags = [],
  internalNotes = [],
  catalogTags = DEFAULT_SCREENING_CATALOG_TAGS,
  currentUserName = 'Chuyên viên Tuyển dụng',
  currentUserRole = 'Recruiter',
  onRatingChange,
  onTagsChange,
  onAddNote,
  isCompact = false,
  className = '',
}) => {
  // Trạng thái hover sao để tạo phản hồi thị giác tức thì (Instant Visual Feedback)
  const [hoverStarRating, setHoverStarRating] = useState<number | null>(null);
  const [isUpdatingRating, setIsUpdatingRating] = useState<boolean>(false);

  // Trạng thái thêm nhãn tùy chỉnh ngoài danh mục
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [isAddingCustomTag, setIsAddingCustomTag] = useState<boolean>(false);

  // Trạng thái nhập ghi chú nội bộ mới
  const [internalNoteContent, setInternalNoteContent] = useState<string>('');
  const [selectedNoteCategory, setSelectedNoteCategory] =
    useState<CandidateInternalNote['category']>('SCREENING');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [noteValidationError, setNoteValidationError] = useState<string | null>(null);

  // Định dạng thời gian Việt Nam chuẩn hóa
  const formatVietnamDateTime = (dateIsoString: string): string => {
    try {
      const parsedDate = new Date(dateIsoString);
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(parsedDate);
    } catch {
      return dateIsoString;
    }
  };

  // 1. XỬ LÝ ĐÁNH GIÁ 1 - 5 SAO (1-CLICK RATING)
  // Tại sao: Recruiter cần phân loại ngay hồ sơ chỉ với 1 thao tác click chuột để đạt tốc độ 20 CV/15 phút
  const handleSelectStarRating = async (
    targetRating: number,
    mouseEvent: React.MouseEvent<HTMLButtonElement>
  ) => {
    mouseEvent.preventDefault();
    if (!onRatingChange || isUpdatingRating) return;

    // Nếu click lại vào số sao hiện tại thì đặt về 0 để cho phép hủy đánh giá
    const finalRating = candidateStarRating === targetRating ? 0 : targetRating;

    setIsUpdatingRating(true);
    try {
      await onRatingChange(finalRating);
    } finally {
      setIsUpdatingRating(false);
    }
  };

  // 2. XỬ LÝ GẮN NHÃN TỪ DANH MỤC (MULTI-SELECT CATALOG TAGS)
  // Tại sao: Bố trí nhãn danh mục dưới dạng pills cho phép chọn nhanh nhiều nhãn mà không cần gõ phím
  const handleToggleCatalogTag = async (
    catalogTagItem: ScreeningCatalogTag,
    mouseEvent: React.MouseEvent<HTMLButtonElement>
  ) => {
    mouseEvent.preventDefault();
    if (!onTagsChange) return;

    const isAlreadySelected = selectedScreeningTags.some(
      (existingTag) =>
        existingTag.name.trim().toLowerCase() === catalogTagItem.name.trim().toLowerCase()
    );

    let updatedTags: CandidateTag[];
    if (isAlreadySelected) {
      updatedTags = selectedScreeningTags.filter(
        (existingTag) =>
          existingTag.name.trim().toLowerCase() !== catalogTagItem.name.trim().toLowerCase()
      );
    } else {
      const newTag: CandidateTag = {
        id: catalogTagItem.id,
        name: catalogTagItem.name,
        colorClass: catalogTagItem.colorClass,
      };
      updatedTags = [...selectedScreeningTags, newTag];
    }

    await onTagsChange(updatedTags);
  };

  const handleRemoveScreeningTag = async (
    tagIdToRemove: string,
    mouseEvent: React.MouseEvent<HTMLButtonElement>
  ) => {
    mouseEvent.preventDefault();
    if (!onTagsChange) return;

    const updatedTags = selectedScreeningTags.filter(
      (existingTag) => existingTag.id !== tagIdToRemove
    );
    await onTagsChange(updatedTags);
  };

  const handleAddCustomTag = async (formEvent?: React.FormEvent<HTMLFormElement>) => {
    if (formEvent) formEvent.preventDefault();
    const trimmedTagName = customTagInput.trim();
    if (!trimmedTagName || !onTagsChange) return;

    const isDuplicate = selectedScreeningTags.some(
      (existingTag) => existingTag.name.toLowerCase() === trimmedTagName.toLowerCase()
    );
    if (isDuplicate) {
      setCustomTagInput('');
      setIsAddingCustomTag(false);
      return;
    }

    const newTag: CandidateTag = {
      id: `custom-tag-${trimmedTagName.toLowerCase().replace(/\s+/g, '-')}`,
      name: trimmedTagName,
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };

    const updatedTags = [...selectedScreeningTags, newTag];
    await onTagsChange(updatedTags);
    setCustomTagInput('');
    setIsAddingCustomTag(false);
  };

  // 3. XỬ LÝ THÊM GHI CHÚ NỘI BỘ (INTERNAL NOTES)
  // Tại sao: Bắt buộc đính kèm tên Recruiter và thời gian để phục vụ truy vết đánh giá giữa các thành viên hội đồng
  const handleAddInternalNote = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const trimmedContent = internalNoteContent.trim();

    if (!trimmedContent) {
      setNoteValidationError('Vui lòng nhập nội dung nhận xét trước khi lưu.');
      return;
    }

    setNoteValidationError(null);
    setIsSubmittingNote(true);
    try {
      if (onAddNote) {
        await onAddNote(trimmedContent, selectedNoteCategory);
      }
      setInternalNoteContent('');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const starNumbersList = Array.from(
    { length: MAX_STAR_RATING - MIN_STAR_RATING + 1 },
    (_, indexNumber) => MIN_STAR_RATING + indexNumber
  );

  const activeDisplayRating =
    hoverStarRating !== null ? hoverStarRating : candidateStarRating;

  return (
    <div
      aria-label="Cụm công cụ sàng lọc nhanh hồ sơ ứng viên"
      className={`rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Header cụm sàng lọc */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-amber-50/40 via-white to-indigo-50/30 px-5 py-3.5 dark:border-gray-800 dark:from-amber-950/20 dark:via-gray-900 dark:to-indigo-950/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Sàng lọc nhanh hồ sơ (Screening)
            </h3>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800">
              Thao tác 1-click
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Tối ưu cho Recruiter</span>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* PHẦN 1: ĐÁNH GIÁ 1 - 5 SAO TRỰC QUAN */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 dark:border-amber-950/40 dark:bg-amber-950/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Đánh giá mức độ tiềm năng (1 – 5 sao)
              </span>
              <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/80">
                Nhấp 1 cú click để chấm sao sơ loại. Nhấp lại sao hiện tại để xóa đánh giá.
              </p>
            </div>

            {/* Cụm 5 nút sao thao tác nhanh */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 rounded-lg bg-white p-1 shadow-2xs ring-1 ring-amber-200 dark:bg-gray-800 dark:ring-amber-900/60">
                {starNumbersList.map((starNumber) => {
                  const isStarFilled = starNumber <= activeDisplayRating;
                  return (
                    <button
                      key={starNumber}
                      type="button"
                      id={`screening-star-${starNumber}-btn`}
                      aria-label={`Đánh giá ${starNumber} sao`}
                      disabled={isUpdatingRating}
                      onMouseEnter={() => setHoverStarRating(starNumber)}
                      onMouseLeave={() => setHoverStarRating(null)}
                      onClick={(mouseEvent) =>
                        handleSelectStarRating(starNumber, mouseEvent)
                      }
                      className="rounded-md p-1.5 transition-transform hover:scale-125 focus:ring-2 focus:ring-amber-400 focus:outline-hidden disabled:opacity-50"
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          isStarFilled
                            ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {candidateStarRating > 0 && (
                <button
                  type="button"
                  title="Xóa đánh giá sao"
                  onClick={(mouseEvent) => handleSelectStarRating(0, mouseEvent)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dòng mô tả ý nghĩa số sao đã chọn */}
          <div className="mt-2 text-xs font-medium text-amber-900 dark:text-amber-300">
            {activeDisplayRating > 0 ? (
              <span>{`Mức ${activeDisplayRating}/5 sao: ${STAR_RATING_DESCRIPTIONS[activeDisplayRating]}`}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">
                Chưa đánh giá sao cho hồ sơ này
              </span>
            )}
          </div>
        </div>

        {/* PHẦN 2: GẮN NHÃN HỒ SƠ (MULTI-SELECT TAGS TỪ DANH MỤC) */}
        <div>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Gắn nhãn phân loại hồ sơ (Multi-select Tags)
              </label>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                {`${selectedScreeningTags.length} nhãn đã chọn`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingCustomTag((previousState) => !previousState)}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              <Plus className="h-3 w-3" />
              Tạo nhãn riêng
            </button>
          </div>

          {/* Danh mục nhãn chuẩn bị sẵn (Catalog Pills) - Nhấp để chọn/bỏ chọn ngay */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-800/40">
            <span className="mb-2 block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Nhãn danh mục gợi ý nhanh (Click để gắn/bỏ):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {catalogTags.map((catalogTagItem) => {
                const isSelected = selectedScreeningTags.some(
                  (existingTag) =>
                    existingTag.name.trim().toLowerCase() ===
                    catalogTagItem.name.trim().toLowerCase()
                );

                return (
                  <button
                    key={catalogTagItem.id}
                    type="button"
                    onClick={(mouseEvent) =>
                      handleToggleCatalogTag(catalogTagItem, mouseEvent)
                    }
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                        : 'border border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{catalogTagItem.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ô nhập tạo nhãn riêng nếu cần */}
          {isAddingCustomTag && (
            <form
              onSubmit={handleAddCustomTag}
              className="mt-2.5 flex items-center gap-2"
            >
              <input
                id="custom-screening-tag-input"
                type="text"
                value={customTagInput}
                onChange={(changeEvent) => setCustomTagInput(changeEvent.target.value)}
                placeholder="Nhập tên nhãn riêng (VD: Đã làm việc tại FPT, TOEIC 850)..."
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <Plus className="h-3 w-3" />
                Thêm
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCustomTag(false)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Hủy
              </button>
            </form>
          )}

          {/* Danh sách các nhãn đang được gắn trên hồ sơ ứng viên */}
          {selectedScreeningTags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-gray-400">
                Đang gắn:
              </span>
              {selectedScreeningTags.map((tagItem) => (
                <span
                  key={tagItem.id}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${tagItem.colorClass || 'border-gray-200 bg-gray-100 text-gray-700'}`}
                >
                  <span>{tagItem.name}</span>
                  <button
                    type="button"
                    aria-label={`Gỡ nhãn ${tagItem.name}`}
                    onClick={(mouseEvent) =>
                      handleRemoveScreeningTag(tagItem.id, mouseEvent)
                    }
                    className="rounded-full p-0.5 text-gray-400 hover:bg-black/10 hover:text-gray-700 dark:hover:bg-white/20 dark:hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* PHẦN 3: GHI CHÚ NỘI BỘ (INTERNAL NOTES) */}
        <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <label
                htmlFor="screening-internal-note-textarea"
                className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300"
              >
                Ghi chú nội bộ
              </label>
            </div>

            {/* CHÚ THÍCH BẮT BUỘC THEO ĐẶC TẢ */}
            <div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800">
              <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <span>Ghi chú nội bộ (Ứng viên không bao giờ nhìn thấy)</span>
            </div>
          </div>

          {/* Form nhập ghi chú mới */}
          <form onSubmit={handleAddInternalNote} className="space-y-2">
            {noteValidationError && (
              <div className="rounded-md bg-rose-50 px-3 py-1.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                {noteValidationError}
              </div>
            )}

            <div className="relative">
              <textarea
                id="screening-internal-note-textarea"
                rows={isCompact ? 2 : 3}
                value={internalNoteContent}
                onChange={(changeEvent) =>
                  setInternalNoteContent(changeEvent.target.value)
                }
                placeholder="Nhập nhận xét sơ loại CV, thái độ, mức lương mong muốn, kỹ năng nổi bật..."
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Chọn danh mục phân loại ghi chú */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-400">Phân loại:</span>
                  <select
                    id="screening-note-category-select"
                    value={selectedNoteCategory}
                    onChange={(changeEvent) =>
                      setSelectedNoteCategory(
                        changeEvent.target.value as CandidateInternalNote['category']
                      )
                    }
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <option value="SCREENING">Sơ loại CV</option>
                    <option value="INTERVIEW">Phỏng vấn</option>
                    <option value="OFFER">Lương thưởng</option>
                    <option value="CULTURE">Văn hóa & Kỹ năng mềm</option>
                    <option value="GENERAL">Chung</option>
                  </select>
                </div>

                <span className="text-[11px] text-gray-400">
                  Người viết: <span className="font-medium text-gray-600 dark:text-gray-300">{currentUserName}</span> ({currentUserRole})
                </span>
              </div>

              {/* Nút gửi thêm ghi chú */}
              <button
                type="submit"
                id="submit-internal-note-btn"
                disabled={isSubmittingNote}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isSubmittingNote ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Thêm ghi chú
              </button>
            </div>
          </form>

          {/* Danh sách các ghi chú đã viết trên hồ sơ */}
          {internalNotes.length > 0 && (
            <div className="mt-4 space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {`Lịch sử ghi chú (${internalNotes.length}):`}
              </span>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {internalNotes.map((noteItem) => (
                  <div
                    key={noteItem.id}
                    className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs dark:border-gray-800 dark:bg-gray-850"
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-1.5">
                      {/* BẮT BUỘC: Hiển thị rõ Tên người viết */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          {noteItem.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {noteItem.authorName}
                        </span>
                        {noteItem.authorRole && (
                          <span className="text-[11px] text-gray-400">
                            • {noteItem.authorRole}
                          </span>
                        )}
                      </div>

                      {/* BẮT BUỘC: Thời gian viết */}
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{formatVietnamDateTime(noteItem.createdAt)}</span>
                      </div>
                    </div>

                    {/* BẮT BUỘC: Nội dung ghi chú */}
                    <p className="mt-1 leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {noteItem.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateScreeningWidget;
