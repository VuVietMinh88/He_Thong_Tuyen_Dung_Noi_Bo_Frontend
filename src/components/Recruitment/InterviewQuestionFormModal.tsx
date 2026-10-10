import { useState, useEffect, useCallback, type FC, type FormEvent } from 'react';
import {
  businessService,
  type CompetencyCriterion,
  type CompetencyFramework,
  type InterviewQuestion,
  type Position,
} from '../../services/business.service';

export interface InterviewQuestionFormModalProps {
  isOpen: boolean;
  questionToEdit?: InterviewQuestion | null;
  initialPositionId?: string;
  initialFrameworkId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  positionId?: string;
  frameworkId?: string;
  criterionId?: string;
  content?: string;
  difficulty?: string;
}

export const InterviewQuestionFormModal: FC<InterviewQuestionFormModalProps> = ({
  isOpen,
  questionToEdit,
  initialPositionId = '',
  initialFrameworkId = '',
  onClose,
  onSuccess,
}) => {
  // Dữ liệu danh mục
  const [positions, setPositions] = useState<Position[]>([]);
  const [frameworks, setFrameworks] = useState<Array<Pick<CompetencyFramework, 'id' | 'code' | 'name' | 'status'>>>([]);
  const [criteria, setCriteria] = useState<CompetencyCriterion[]>([]);

  // Dữ liệu form
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [frameworkId, setFrameworkId] = useState('');
  const [criterionId, setCriterionId] = useState('');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<InterviewQuestion['difficulty']>('MEDIUM');
  const [answerHint, setAnswerHint] = useState('');
  const [active, setActive] = useState(true);

  // Chế độ xem trước
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Trạng thái tải & lỗi
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // 1. Tải danh sách Chức danh và Khung năng lực khi mở Modal
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingMetadata(true);
    setServerError('');
    setInfoMessage('');

    Promise.all([
      businessService.getPositions(0),
      businessService.getFrameworks(0),
    ])
      .then(([positionsRes, frameworksRes]) => {
        if (!isMounted) return;
        setPositions(positionsRes.items);
        setFrameworks(frameworksRes.items);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setServerError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách chức danh và khung năng lực.',
        );
      })
      .finally(() => {
        if (isMounted) setIsLoadingMetadata(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 2. Đồng bộ giá trị khi mở modal (Tạo mới hoặc Sửa)
  useEffect(() => {
    if (!isOpen) return;

    setErrors({});
    setServerError('');
    setInfoMessage('');
    setActiveTab('form');

    if (questionToEdit) {
      setFrameworkId(questionToEdit.framework.id);
      setCriterionId(questionToEdit.criterion.id);
      setContent(questionToEdit.content);
      setDifficulty(questionToEdit.difficulty);
      setAnswerHint(questionToEdit.answerHint ?? '');
      setActive(questionToEdit.active);
      setSelectedPositionId('');
    } else {
      setSelectedPositionId(initialPositionId);
      setFrameworkId(initialFrameworkId);
      setCriterionId('');
      setContent('');
      setDifficulty('MEDIUM');
      setAnswerHint('');
      setActive(true);
      setCriteria([]);
    }
  }, [isOpen, questionToEdit, initialPositionId, initialFrameworkId]);

  // 3. Khi người dùng chọn Chức danh -> Tự động xác định Khung năng lực & Tiêu chí
  const handlePositionChange = useCallback(
    async (posId: string) => {
      setSelectedPositionId(posId);
      setInfoMessage('');
      setErrors((prev) => ({ ...prev, positionId: undefined }));

      if (!posId) return;

      setIsLoadingCriteria(true);
      try {
        const evalData = await businessService.getEvaluationCriteria(posId);
        if (evalData.framework) {
          setFrameworkId(evalData.framework.id);
          setCriteria(evalData.criteria);
          setCriterionId('');
          setErrors((prev) => ({ ...prev, frameworkId: undefined, criterionId: undefined }));
          setInfoMessage(
            `Đã liên kết Khung năng lực "${evalData.framework.name}" (${evalData.criteria.length} tiêu chí) theo chức danh đã chọn.`,
          );
        } else {
          setInfoMessage(
            'Chức danh này chưa được gán khung năng lực. Bạn có thể chọn trực tiếp khung năng lực bên dưới.',
          );
        }
      } catch {
        setInfoMessage('Chưa tìm thấy tiêu chí riêng của chức danh này. Hãy chọn Khung năng lực tương ứng.');
      } finally {
        setIsLoadingCriteria(false);
      }
    },
    [],
  );

  // 4. Khi chọn Khung năng lực trực tiếp -> Tải danh sách tiêu chí của khung
  useEffect(() => {
    if (!frameworkId) {
      if (!selectedPositionId) {
        setCriteria([]);
        setCriterionId('');
      }
      return;
    }

    let isMounted = true;
    setIsLoadingCriteria(true);

    businessService
      .getFramework(frameworkId)
      .then((res) => {
        if (!isMounted) return;
        setCriteria(res.criteria);

        // Nếu chuyển sang framework khác không trùng với questionToEdit thì reset criterionId
        if (questionToEdit?.framework.id !== frameworkId) {
          setCriterionId('');
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setServerError(
          err instanceof Error
            ? err.message
            : 'Không thể tải tiêu chí đánh giá của khung năng lực.',
        );
      })
      .finally(() => {
        if (isMounted) setIsLoadingCriteria(false);
      });

    return () => {
      isMounted = false;
    };
  }, [frameworkId, questionToEdit, selectedPositionId]);

  // 5. Validation trước khi lưu (AC2)
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!frameworkId) {
      newErrors.frameworkId = 'Vui lòng chọn Khung năng lực hoặc Chức danh áp dụng.';
    }

    if (!criterionId) {
      newErrors.criterionId = 'Vui lòng chọn Tiêu chí đánh giá thuộc khung năng lực.';
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      newErrors.content = 'Nội dung câu hỏi phỏng vấn không được để trống.';
    } else if (trimmedContent.length < 5) {
      newErrors.content = 'Nội dung câu hỏi quá ngắn (cần tối thiểu 5 ký tự).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 6. Xử lý lưu form (AC2 & AC3)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError('');

    if (!validateForm()) {
      setActiveTab('form');
      return;
    }

    const selectedCriterion = criteria.find((c) => c.id === criterionId);
    if (!selectedCriterion) {
      setErrors((prev) => ({
        ...prev,
        criterionId: 'Tiêu chí đánh giá đã chọn không hợp lệ.',
      }));
      return;
    }

    setIsSaving(true);

    try {
      await businessService.saveQuestion(questionToEdit?.id ?? null, {
        criterion: { id: selectedCriterion.id, name: selectedCriterion.name },
        content: content.trim(),
        difficulty,
        answerHint: answerHint.trim() || null,
        active,
      });

      onSuccess();
      onClose();
    } catch (saveError: unknown) {
      setServerError(
        saveError instanceof Error ? saveError.message : 'Không thể lưu câu hỏi phỏng vấn.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Phím tắt ESC để đóng modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Mẫu gợi ý cấu trúc trả lời nhanh
  const applyHintTemplate = (type: 'star' | 'levels') => {
    if (type === 'star') {
      const template = `[Cấu trúc STAR mong đợi]:
- Situation: Ứng viên mô tả bối cảnh dự án/thử thách thực tế.
- Task: Mục tiêu và trách nhiệm cụ thể của ứng viên.
- Action: Giải pháp kỹ thuật, quyết định công nghệ và cách triển khai.
- Result: Kết quả đo lường được (Performance, tải, lỗi giảm, phản hồi người dùng).`;
      setAnswerHint((prev) => (prev ? `${prev}\n\n${template}` : template));
    } else {
      const template = `[Tiêu chuẩn đánh giá]:
- Đạt (Trung bình): Nêu được định nghĩa cơ bản và cú pháp sử dụng.
- Khá: Giải thích được nguyên lý hoạt động và trường hợp ứng dụng thực tế.
- Xuất sắc: Phân tích được trade-offs, rủi ro tiềm ẩn và các phương án tối ưu chuyên sâu.`;
      setAnswerHint((prev) => (prev ? `${prev}\n\n${template}` : template));
    }
  };

  if (!isOpen) return null;

  const currentFrameworkObj = frameworks.find((f) => f.id === frameworkId);
  const currentCriterionObj = criteria.find((c) => c.id === criterionId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-modal-title"
    >
      <div className="relative flex max-h-[94vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 id="question-modal-title" className="text-lg font-bold text-slate-900">
                {questionToEdit ? 'Chỉnh sửa câu hỏi phỏng vấn' : 'Tạo mới câu hỏi phỏng vấn'}
              </h2>
              <p className="text-xs text-slate-500">
                Gắn kết câu hỏi với Khung năng lực, Chức danh tuyển dụng và Tiêu chuẩn đánh giá chuẩn hóa.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-hidden disabled:opacity-50"
            aria-label="Đóng modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation (Form / Preview) */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`border-b-2 px-3 py-2.5 transition-colors ${
              activeTab === 'form'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Biểu mẫu nhập liệu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition-colors ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Xem trước hiển thị (Preview)</span>
            {content.trim() && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Server Error Alert */}
          {serverError && (
            <div
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
              role="alert"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {/* Info notification */}
          {infoMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-800">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{infoMessage}</span>
            </div>
          )}

          {activeTab === 'form' ? (
            <form id="question-form" onSubmit={handleSubmit} className="space-y-4">
              {/* PHẦN 1: LIÊN KẾT CHỨC DANH & KHUNG NĂNG LỰC */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  1. Phạm vi áp dụng & Tiêu chí khung năng lực
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Chọn Chức danh áp dụng (AC1) */}
                  <div>
                    <label htmlFor="q-position" className="block text-xs font-semibold text-slate-700">
                      Chức danh tuyển dụng áp dụng
                    </label>
                    <select
                      id="q-position"
                      disabled={isLoadingMetadata || isSaving}
                      value={selectedPositionId}
                      onChange={(e) => void handlePositionChange(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                    >
                      <option value="">-- Chọn chức danh tuyển dụng (tùy chọn) --</option>
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name} ({pos.code}) - {pos.level}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Tự động nạp khung năng lực tương ứng khi chọn chức danh.
                    </p>
                  </div>

                  {/* Chọn Khung năng lực (AC1) */}
                  <div>
                    <label htmlFor="q-framework" className="block text-xs font-semibold text-slate-700">
                      Khung năng lực <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="q-framework"
                      required
                      disabled={isLoadingMetadata || isSaving}
                      value={frameworkId}
                      onChange={(e) => {
                        setFrameworkId(e.target.value);
                        setErrors((prev) => ({ ...prev, frameworkId: undefined }));
                      }}
                      className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 focus:ring-1 disabled:bg-slate-100 ${
                        errors.frameworkId
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                      }`}
                    >
                      <option value="">-- Chọn khung năng lực --</option>
                      {frameworks.map((fw) => (
                        <option key={fw.id} value={fw.id}>
                          {fw.name} ({fw.code})
                        </option>
                      ))}
                    </select>
                    {errors.frameworkId ? (
                      <p className="mt-1 text-[11px] text-rose-600">{errors.frameworkId}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">Khung năng lực chứa các tiêu chí chuẩn hóa.</p>
                    )}
                  </div>
                </div>

                {/* Chọn Tiêu chí đánh giá (AC1) */}
                <div>
                  <label htmlFor="q-criterion" className="block text-xs font-semibold text-slate-700">
                    Tiêu chí đánh giá thuộc khung năng lực <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="q-criterion"
                    required
                    disabled={!frameworkId || isLoadingCriteria || isSaving}
                    value={criterionId}
                    onChange={(e) => {
                      setCriterionId(e.target.value);
                      setErrors((prev) => ({ ...prev, criterionId: undefined }));
                    }}
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 focus:ring-1 disabled:bg-slate-100 ${
                      errors.criterionId
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  >
                    <option value="">
                      {!frameworkId
                        ? '-- Hãy chọn khung năng lực hoặc chức danh trước --'
                        : isLoadingCriteria
                        ? '-- Đang tải tiêu chí đánh giá... --'
                        : criteria.length === 0
                        ? '-- Khung năng lực này chưa có tiêu chí --'
                        : '-- Chọn tiêu chí đánh giá cụ thể --'}
                    </option>
                    {criteria.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.weight ? `(Trọng số: ${c.weight}%)` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.criterionId ? (
                    <p className="mt-1 text-[11px] text-rose-600">{errors.criterionId}</p>
                  ) : currentCriterionObj?.description ? (
                    <p className="mt-1 text-[11px] text-slate-500 italic">
                      Mô tả: {currentCriterionObj.description}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* PHẦN 2: MỨC ĐỘ KHÓ (AC1) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mức độ khó của câu hỏi <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: 'EASY',
                      label: 'Dễ (Basic)',
                      sub: 'Fresher / Junior',
                      color: 'border-emerald-300 bg-emerald-50/70 text-emerald-800',
                      iconBg: 'bg-emerald-100 text-emerald-700',
                    },
                    {
                      value: 'MEDIUM',
                      label: 'Trung bình (Medium)',
                      sub: 'Mid-level',
                      color: 'border-amber-300 bg-amber-50/70 text-amber-800',
                      iconBg: 'bg-amber-100 text-amber-700',
                    },
                    {
                      value: 'HARD',
                      label: 'Khó (Advanced)',
                      sub: 'Senior / Lead',
                      color: 'border-rose-300 bg-rose-50/70 text-rose-800',
                      iconBg: 'bg-rose-100 text-rose-700',
                    },
                  ].map((diff) => (
                    <label
                      key={diff.value}
                      className={`flex cursor-pointer flex-col rounded-xl border p-2.5 transition-all select-none ${
                        difficulty === diff.value
                          ? `${diff.color} ring-2 ring-indigo-500 shadow-xs`
                          : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="question-difficulty"
                        value={diff.value}
                        checked={difficulty === diff.value}
                        onChange={(e) =>
                          setDifficulty(e.target.value as InterviewQuestion['difficulty'])
                        }
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{diff.label}</span>
                        {difficulty === diff.value && (
                          <span className="h-2 w-2 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <span className="mt-0.5 text-[10px] text-slate-500">{diff.sub}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* PHẦN 3: NỘI DUNG CÂU HỎI (AC1) */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="q-content" className="block text-xs font-semibold text-slate-700">
                    Nội dung câu hỏi phỏng vấn chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] ${
                      content.length > 1800 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {content.length}/2000
                  </span>
                </div>
                <textarea
                  id="q-content"
                  required
                  rows={4}
                  maxLength={2000}
                  placeholder="VD: Hãy trình bày cách bạn thiết kế cấu trúc State Management cho một ứng dụng React quy mô lớn và xử lý các vấn đề liên quan đến Re-render không mong muốn?"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setErrors((prev) => ({ ...prev, content: undefined }));
                  }}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs text-slate-900 focus:ring-1 ${
                    errors.content
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                {errors.content && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.content}</p>
                )}
              </div>

              {/* PHẦN 4: GỢI Ý CÂU TRẢ LỜI MẪU (AC1) */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="q-hint" className="block text-xs font-semibold text-slate-700">
                    Gợi ý câu trả lời tốt / Tiêu chuẩn chấm điểm (Answer Hint)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => applyHintTemplate('star')}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      + Mẫu STAR
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => applyHintTemplate('levels')}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      + Thang đánh giá
                    </button>
                  </div>
                </div>
                <textarea
                  id="q-hint"
                  rows={4}
                  maxLength={4000}
                  placeholder="Gợi ý các ý chính ứng viên cần trả lời (ví dụ: Sử dụng useMemo, React.memo, Context split, Redux Toolkit/Zustand, React Query caching)..."
                  value={answerHint}
                  onChange={(e) => setAnswerHint(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Gợi ý này chỉ hiển thị cho người phỏng vấn để làm căn cứ chấm điểm năng lực.
                </p>
              </div>

              {/* PHẦN 5: TRẠNG THÁI HOẠT ĐỘNG */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div>
                  <span className="text-xs font-semibold text-slate-800">Trạng thái áp dụng</span>
                  <p className="text-[11px] text-slate-500">
                    {active
                      ? 'Câu hỏi đang hoạt động và có thể tra cứu khi phỏng vấn.'
                      : 'Tạm ẩn câu hỏi khỏi danh sách tra cứu thông thường.'}
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="h-5 w-9 rounded-full bg-slate-300 peer-checked:bg-indigo-600 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </form>
          ) : (
            /* TAB XEM TRƯỚC (LIVE PREVIEW) */
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 text-xs text-indigo-900">
                <span className="font-semibold">Mô phỏng hiển thị:</span> Đây là hình thức câu hỏi sẽ xuất hiện trong giao diện ngân hàng câu hỏi của người phỏng vấn.
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        difficulty === 'EASY'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : difficulty === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                          : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                      }`}
                    >
                      {difficulty === 'EASY'
                        ? 'Dễ (Basic)'
                        : difficulty === 'MEDIUM'
                        ? 'Trung bình (Medium)'
                        : 'Khó (Advanced)'}
                    </span>

                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {currentCriterionObj?.name || 'Chưa chọn tiêu chí'}
                    </span>

                    {currentFrameworkObj && (
                      <span className="text-[11px] text-slate-500">
                        • {currentFrameworkObj.name}
                      </span>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {active ? '● Đang áp dụng' : '○ Tạm dừng'}
                  </span>
                </div>

                {/* Nội dung câu hỏi */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {content.trim() || (
                      <span className="italic text-slate-400">
                        Chưa có nội dung câu hỏi. Vui lòng nhập ở tab Biểu mẫu.
                      </span>
                    )}
                  </h4>
                </div>

                {/* Gợi ý câu trả lời */}
                {answerHint ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900 space-y-1">
                    <div className="font-semibold text-amber-800 flex items-center gap-1.5">
                      <span>💡 Gợi ý câu trả lời chuẩn & Tiêu chuẩn chấm điểm:</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-xs text-amber-950">
                      {answerHint}
                    </pre>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 p-2 text-center text-xs text-slate-400">
                    Chưa có gợi ý câu trả lời mẫu
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (AC3) */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3.5 rounded-b-2xl">
          <div className="text-[11px] text-slate-500">
            {questionToEdit ? 'Đang cập nhật câu hỏi có sẵn' : 'Tạo mới câu hỏi vào ngân hàng'}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-hidden disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="question-form"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-98 focus:outline-hidden disabled:opacity-50 transition-all"
            >
              {isSaving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{questionToEdit ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi mới'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewQuestionFormModal;
