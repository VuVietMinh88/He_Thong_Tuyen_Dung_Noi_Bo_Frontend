import { useState, useEffect, useCallback, type FC } from 'react';
import {
  businessService,
  type CompetencyCriterion,
  type CompetencyFramework,
  type InterviewQuestion,
} from '../../services/business.service';
import { usePermission } from '../../hooks/usePermission';
import InterviewQuestionFormModal from './InterviewQuestionFormModal';

export const InterviewQuestionList: FC = () => {
  const { permissions } = usePermission();
  const canWrite = permissions.includes('ORGANIZATION_WRITE_ALL');

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [frameworks, setFrameworks] = useState<Array<Pick<CompetencyFramework, 'id' | 'code' | 'name'>>>([]);
  const [criteria, setCriteria] = useState<CompetencyCriterion[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Bộ lọc thông minh (AC1)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFrameworkId, setSelectedFrameworkId] = useState('');
  const [selectedCriterionId, setSelectedCriterionId] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Quản lý trạng thái mở rộng gợi ý câu trả lời (Answer hint toggle)
  const [expandedHintIds, setExpandedHintIds] = useState<Record<string, boolean>>({});

  // Trạng thái modal thêm/sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);

  // Tải danh sách câu hỏi và danh sách frameworks
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [questionsRes, frameworksRes] = await Promise.all([
        businessService.getQuestions(0),
        businessService.getFrameworks(0),
      ]);
      setQuestions(questionsRes.items);
      setFrameworks(frameworksRes.items);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải danh sách câu hỏi phỏng vấn.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // Khi chọn Framework trong bộ lọc, tải danh sách tiêu chí của Framework đó
  useEffect(() => {
    if (!selectedFrameworkId) {
      setCriteria([]);
      setSelectedCriterionId('');
      return;
    }

    let isMounted = true;
    businessService
      .getFramework(selectedFrameworkId)
      .then((res) => {
        if (isMounted) {
          setCriteria(res.criteria);
          setSelectedCriterionId('');
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải danh sách tiêu chí.',
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFrameworkId]);

  // Toggle ẩn/hiện gợi ý trả lời
  const toggleHint = (questionId: string) => {
    setExpandedHintIds((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (q: InterviewQuestion) => {
    setEditingQuestion(q);
    setIsModalOpen(true);
  };

  // Xóa câu hỏi (AC3)
  const handleDeleteQuestion = async (q: InterviewQuestion) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa câu hỏi "${q.content.slice(0, 50)}..."?`)) {
      return;
    }

    try {
      await businessService.deleteQuestion(q.id);
      void loadInitialData();
    } catch (delError: unknown) {
      setErrorMessage(
        delError instanceof Error ? delError.message : 'Không thể xóa câu hỏi phỏng vấn.',
      );
    }
  };

  // Reset bộ lọc
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFrameworkId('');
    setSelectedCriterionId('');
    setSelectedDifficulty('ALL');
    setSelectedStatus('ALL');
  };

  // Áp dụng bộ lọc thông minh (AC1)
  const filteredQuestions = questions.filter((q) => {
    // 1. Tìm kiếm từ khóa
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      q.content.toLowerCase().includes(term) ||
      (q.answerHint && q.answerHint.toLowerCase().includes(term)) ||
      q.criterion.name.toLowerCase().includes(term) ||
      q.framework.name.toLowerCase().includes(term);

    // 2. Lọc theo Khung năng lực
    const matchesFramework =
      !selectedFrameworkId || q.framework.id === selectedFrameworkId;

    // 3. Lọc theo Tiêu chí
    const matchesCriterion =
      !selectedCriterionId || q.criterion.id === selectedCriterionId;

    // 4. Lọc theo Độ khó
    const matchesDifficulty =
      selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;

    // 5. Lọc theo Trạng thái
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && q.active) ||
      (selectedStatus === 'INACTIVE' && !q.active);

    return (
      matchesSearch &&
      matchesFramework &&
      matchesCriterion &&
      matchesDifficulty &&
      matchesStatus
    );
  });

  // Thống kê số lượng
  const totalQuestions = questions.length;
  const easyCount = questions.filter((q) => q.difficulty === 'EASY').length;
  const mediumCount = questions.filter((q) => q.difficulty === 'MEDIUM').length;
  const hardCount = questions.filter((q) => q.difficulty === 'HARD').length;

  return (
    <div className="space-y-6">
      {/* Header & Thao tác thêm mới */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ngân Hàng Câu Hỏi Phỏng Vấn
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tra cứu câu hỏi chuẩn theo khung năng lực, tiêu chí đánh giá và mức độ khó cho người phỏng vấn.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-98"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm câu hỏi mới</span>
          </button>
        )}
      </div>

      {/* Thẻ thống kê số lượng theo độ khó */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-slate-500">Tổng số câu hỏi</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{totalQuestions}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-emerald-700">Mức độ Dễ</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-800">{easyCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-amber-700">Mức độ Trung bình</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-800">{mediumCount}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-rose-700">Mức độ Khó</p>
          <p className="mt-2 text-2xl font-extrabold text-rose-800">{hardCount}</p>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Bộ lọc thông minh (Filters & Search - AC1) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Bộ lọc & Tìm kiếm câu hỏi
          </h2>
          {(searchTerm || selectedFrameworkId || selectedCriterionId || selectedDifficulty !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1. Tìm kiếm theo từ khóa */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <input
              type="text"
              placeholder="Tìm theo nội dung, câu hỏi, gợi ý..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pr-4 pl-9 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <svg
              className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 2. Lọc theo Khung năng lực */}
          <div>
            <select
              value={selectedFrameworkId}
              onChange={(e) => setSelectedFrameworkId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Tất cả khung năng lực</option>
              {frameworks.map((fw) => (
                <option key={fw.id} value={fw.id}>
                  {fw.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Lọc theo Tiêu chí đánh giá */}
          <div>
            <select
              disabled={!selectedFrameworkId}
              value={selectedCriterionId}
              onChange={(e) => setSelectedCriterionId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {!selectedFrameworkId ? 'Chọn khung năng lực trước' : 'Tất cả tiêu chí'}
              </option>
              {criteria.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Lọc theo Mức độ khó */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả mức độ khó</option>
              <option value="EASY">Dễ (Basic)</option>
              <option value="MEDIUM">Trung bình (Medium)</option>
              <option value="HARD">Khó (Advanced)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách câu hỏi phỏng vấn (AC2 & AC3) */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white text-slate-500 shadow-xs">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span className="text-sm">Đang tải ngân hàng câu hỏi...</span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-slate-500 shadow-xs">
            <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-sm font-medium text-slate-600">Không tìm thấy câu hỏi phù hợp.</p>
            <p className="text-xs text-slate-400">Thử thay đổi từ khóa hoặc điều kiện lọc ở trên.</p>
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const isHintOpen = expandedHintIds[q.id];

            return (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                {/* Header Card: Badges & Thao tác */}
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                      #{index + 1}
                    </span>

                    {/* Badge Mức độ khó (AC2) */}
                    {q.difficulty === 'EASY' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Dễ (Basic)
                      </span>
                    )}
                    {q.difficulty === 'MEDIUM' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Trung bình (Medium)
                      </span>
                    )}
                    {q.difficulty === 'HARD' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Khó (Advanced)
                      </span>
                    )}

                    {/* Badge Khung năng lực & Tiêu chí (AC2) */}
                    <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {q.framework.name} &gt; {q.criterion.name}
                    </span>

                    {/* Badge Trạng thái */}
                    {!q.active && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        Đã tạm ẩn
                      </span>
                    )}
                  </div>

                  {/* Nút Sửa / Xóa (AC3) */}
                  {canWrite && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(q)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q)}
                        className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Xóa câu hỏi"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Nội dung câu hỏi (AC2) */}
                <div className="pt-3">
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {q.content}
                  </p>
                </div>

                {/* Gợi ý câu trả lời mẫu (Answer Hint - Collapsible) (AC2) */}
                {q.answerHint && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => toggleHint(q.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <svg
                        className={`h-3.5 w-3.5 transition-transform ${isHintOpen ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span>{isHintOpen ? 'Ẩn gợi ý câu trả lời mẫu' : 'Xem gợi ý câu trả lời mẫu (Answer Hint)'}</span>
                    </button>

                    {isHintOpen && (
                      <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-slate-700 leading-relaxed">
                        <div className="flex items-center gap-1.5 text-indigo-800 font-bold mb-1">
                          <span>💡 Tiêu chuẩn câu trả lời gợi ý:</span>
                        </div>
                        <p className="whitespace-pre-line text-slate-600">
                          {q.answerHint}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Form Thêm/Sửa câu hỏi */}
      <InterviewQuestionFormModal
        isOpen={isModalOpen}
        questionToEdit={editingQuestion}
        initialFrameworkId={selectedFrameworkId}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => void loadInitialData()}
      />
    </div>
  );
};

export default InterviewQuestionList;
