import { useState, useEffect, type FC, type FormEvent } from 'react';
import {
  businessService,
  type CompetencyCriterion,
  type CompetencyFramework,
  type InterviewQuestion,
} from '../../services/business.service';

export interface InterviewQuestionFormModalProps {
  isOpen: boolean;
  questionToEdit?: InterviewQuestion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const InterviewQuestionFormModal: FC<InterviewQuestionFormModalProps> = ({
  isOpen,
  questionToEdit,
  onClose,
  onSuccess,
}) => {
  const [frameworks, setFrameworks] = useState<Array<Pick<CompetencyFramework, 'id' | 'code' | 'name' | 'status'>>>([]);
  const [criteria, setCriteria] = useState<CompetencyCriterion[]>([]);

  const [frameworkId, setFrameworkId] = useState('');
  const [criterionId, setCriterionId] = useState('');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<InterviewQuestion['difficulty']>('MEDIUM');
  const [answerHint, setAnswerHint] = useState('');
  const [active, setActive] = useState(true);

  const [isLoadingFrameworks, setIsLoadingFrameworks] = useState(false);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tải danh sách frameworks khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingFrameworks(true);
    setErrorMessage('');

    businessService
      .getFrameworks(0)
      .then((res) => {
        if (isMounted) setFrameworks(res.items);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải danh sách khung năng lực.',
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingFrameworks(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Thiết lập giá trị ban đầu nếu đang chỉnh sửa câu hỏi
  useEffect(() => {
    if (!isOpen) return;

    if (questionToEdit) {
      setFrameworkId(questionToEdit.framework.id);
      setCriterionId(questionToEdit.criterion.id);
      setContent(questionToEdit.content);
      setDifficulty(questionToEdit.difficulty);
      setAnswerHint(questionToEdit.answerHint ?? '');
      setActive(questionToEdit.active);
    } else {
      setFrameworkId('');
      setCriterionId('');
      setContent('');
      setDifficulty('MEDIUM');
      setAnswerHint('');
      setActive(true);
      setCriteria([]);
    }
  }, [isOpen, questionToEdit]);

  // Tải danh sách tiêu chí tương ứng khi chọn khung năng lực
  useEffect(() => {
    if (!frameworkId) {
      setCriteria([]);
      return;
    }

    let isMounted = true;
    setIsLoadingCriteria(true);

    businessService
      .getFramework(frameworkId)
      .then((res) => {
        if (isMounted) {
          setCriteria(res.criteria);
          // Nếu đang tạo mới hoặc criterionId cũ không thuộc framework mới thì reset
          if (questionToEdit?.framework.id !== frameworkId) {
            setCriterionId('');
          }
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải tiêu chí của khung năng lực.',
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingCriteria(false);
      });

    return () => {
      isMounted = false;
    };
  }, [frameworkId, questionToEdit]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!content.trim()) {
      setErrorMessage('Nội dung câu hỏi không được để trống.');
      return;
    }

    const selectedCriterion = criteria.find((c) => c.id === criterionId);
    if (!selectedCriterion) {
      setErrorMessage('Vui lòng chọn tiêu chí đánh giá hợp lệ.');
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
      setErrorMessage(
        saveError instanceof Error ? saveError.message : 'Không thể lưu câu hỏi phỏng vấn.',
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
      aria-labelledby="question-modal-title"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="question-modal-title" className="text-xl font-bold text-slate-900">
              {questionToEdit ? 'Chỉnh sửa câu hỏi phỏng vấn' : 'Thêm câu hỏi phỏng vấn mới'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Lưu trữ câu hỏi chuẩn vào ngân hàng theo từng khung năng lực và tiêu chí đánh giá.
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

        {/* Modal Form Body */}
        <form id="question-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {errorMessage && (
            <div
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
              role="alert"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Chọn Khung năng lực */}
            <div>
              <label htmlFor="q-framework" className="block text-xs font-semibold text-slate-700">
                Khung năng lực <span className="text-rose-500">*</span>
              </label>
              <select
                id="q-framework"
                required
                disabled={isLoadingFrameworks}
                value={frameworkId}
                onChange={(e) => setFrameworkId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
              >
                <option value="">-- Chọn khung năng lực --</option>
                {frameworks.map((fw) => (
                  <option key={fw.id} value={fw.id}>
                    {fw.name} ({fw.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Tiêu chí */}
            <div>
              <label htmlFor="q-criterion" className="block text-xs font-semibold text-slate-700">
                Tiêu chí đánh giá <span className="text-rose-500">*</span>
              </label>
              <select
                id="q-criterion"
                required
                disabled={!frameworkId || isLoadingCriteria}
                value={criterionId}
                onChange={(e) => setCriterionId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
              >
                <option value="">
                  {!frameworkId
                    ? '-- Hãy chọn khung năng lực trước --'
                    : isLoadingCriteria
                    ? '-- Đang tải tiêu chí... --'
                    : '-- Chọn tiêu chí đánh giá --'}
                </option>
                {criteria.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.weight}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mức độ khó (Badge Cards) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mức độ khó <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'EASY', label: 'Dễ (Basic)', color: 'border-emerald-300 bg-emerald-50/60 text-emerald-800' },
                { value: 'MEDIUM', label: 'Trung bình (Medium)', color: 'border-amber-300 bg-amber-50/60 text-amber-800' },
                { value: 'HARD', label: 'Khó (Advanced)', color: 'border-rose-300 bg-rose-50/60 text-rose-800' },
              ].map((diff) => (
                <label
                  key={diff.value}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition-all ${
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
                    onChange={(e) => setDifficulty(e.target.value as InterviewQuestion['difficulty'])}
                    className="sr-only"
                  />
                  <span>{diff.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nội dung câu hỏi */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="q-content" className="block text-xs font-semibold text-slate-700">
                Nội dung câu hỏi phỏng vấn <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{content.length}/2000</span>
            </div>
            <textarea
              id="q-content"
              required
              rows={4}
              maxLength={2000}
              placeholder="VD: Hãy chia sẻ cách bạn thiết kế kiến trúc State Management và tối ưu re-render trong một dự án React lớn?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Gợi ý câu trả lời mẫu */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="q-hint" className="block text-xs font-semibold text-slate-700">
                Gợi ý câu trả lời mẫu / Tiêu chuẩn chấm điểm (Answer Hint)
              </label>
              <span className="text-[11px] text-slate-400">{answerHint.length}/4000</span>
            </div>
            <textarea
              id="q-hint"
              rows={3}
              maxLength={4000}
              placeholder="Gợi ý các ý chính ứng viên cần trả lời (ví dụ: Sử dụng useMemo, React.memo, Context split, Redux Toolkit, React Query)..."
              value={answerHint}
              onChange={(e) => setAnswerHint(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Checkbox Trạng thái sử dụng */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="q-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="q-active" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
              Đang hoạt động và sẵn sàng sử dụng trong các buổi phỏng vấn
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-6 py-3.5 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="question-form"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu câu hỏi</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewQuestionFormModal;
