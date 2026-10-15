import React, { useState, useMemo, useCallback } from 'react';
import {
  Users,
  Award,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Briefcase,
  GraduationCap,
  DollarSign,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Printer,
  ShieldCheck,
  Building,
  UserCheck,
  Clock,
  ThumbsUp,
  XCircle,
  Star,
  Check,
} from 'lucide-react';
import type {
  ComparisonCandidate,
  HiringDecisionStatus,
  ComparisonCategoryKey,
} from '../../types/candidateComparison';
import { COMPARISON_CONSTRAINTS } from '../../types/candidateComparison';
import {
  calculateComparisonHighlights,
  isCandidateTopInCriterion,
  getRecommendationBadgeConfig,
  getDecisionBadgeConfig,
  getScoreColorClass,
  getScorePercentage,
} from '../../utils/candidateComparisonHelper';

export interface CandidateComparisonMatrixProps {
  candidates: ComparisonCandidate[];
  allAvailableCandidates?: ComparisonCandidate[];
  onAddCandidate?: (candidate: ComparisonCandidate) => void;
  onRemoveCandidate?: (candidateId: string) => void;
  onDecisionChange?: (candidateId: string, status: HiringDecisionStatus, note?: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const CandidateComparisonMatrix: React.FC<CandidateComparisonMatrixProps> = ({
  candidates: initialCandidates,
  allAvailableCandidates = [],
  onAddCandidate,
  onRemoveCandidate,
  onDecisionChange,
  onClose,
  isModal = false,
}) => {
  // Quản lý danh sách ứng viên đang được chọn so sánh (2 - 5 ứng viên)
  const [selectedCandidates, setSelectedCandidates] = useState<ComparisonCandidate[]>(
    initialCandidates || []
  );

  // Quản lý trạng thái mở/đóng từng nhóm tiêu chí
  const [collapsedCategories, setCollapsedCategories] = useState<Record<ComparisonCategoryKey, boolean>>({
    GENERAL_INFO: false,
    COMPETENCY: false,
    FEEDBACK: false,
    COMPENSATION: false,
    DECISION: false,
  });

  // Modal chọn thêm ứng viên
  const [isAddPickerOpen, setIsAddPickerOpen] = useState<boolean>(false);

  // Cập nhật selectedCandidates khi props thay đổi
  React.useEffect(() => {
    if (initialCandidates && initialCandidates.length > 0) {
      setSelectedCandidates(initialCandidates);
    }
  }, [initialCandidates]);

  // AC 3: Tự động tính toán điểm nổi bật (Highlights)
  const highlightMap = useMemo(() => {
    return calculateComparisonHighlights(selectedCandidates);
  }, [selectedCandidates]);

  // Toggle thu gọn/mở rộng nhóm tiêu chí
  const toggleCategory = (categoryKey: ComparisonCategoryKey) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  // Xóa ứng viên khỏi bảng so sánh
  const handleRemove = (candidateId: string) => {
    if (selectedCandidates.length <= COMPARISON_CONSTRAINTS.MIN_CANDIDATES) {
      alert(
        `Cần duy trì tối thiểu ${COMPARISON_CONSTRAINTS.MIN_CANDIDATES} ứng viên để có thể đối chiếu so sánh.`
      );
      return;
    }
    const updated = selectedCandidates.filter((c) => c.id !== candidateId);
    setSelectedCandidates(updated);
    if (onRemoveCandidate) {
      onRemoveCandidate(candidateId);
    }
  };

  // Thêm ứng viên vào bảng so sánh
  const handleAdd = (candidate: ComparisonCandidate) => {
    if (selectedCandidates.length >= COMPARISON_CONSTRAINTS.MAX_CANDIDATES) {
      alert(
        `Bảng so sánh hỗ trợ tối đa ${COMPARISON_CONSTRAINTS.MAX_CANDIDATES} ứng viên song song để đảm bảo trải nghiệm tốt nhất.`
      );
      return;
    }
    if (selectedCandidates.some((c) => c.id === candidate.id)) {
      return;
    }
    const updated = [...selectedCandidates, candidate];
    setSelectedCandidates(updated);
    setIsAddPickerOpen(false);
    if (onAddCandidate) {
      onAddCandidate(candidate);
    }
  };

  // Cập nhật quyết định tuyển dụng
  const handleMakeDecision = (candidateId: string, status: HiringDecisionStatus, note?: string) => {
    const finalNote = note || '';
    const updated = selectedCandidates.map((cand) => {
      if (cand.id === candidateId) {
        return {
          ...cand,
          hiringDecision: {
            status,
            decidedAt: new Date().toISOString(),
            decidedBy: 'Hội đồng Tuyển dụng',
            note: finalNote,
          },
        };
      }
      return cand;
    });
    setSelectedCandidates(updated);
    if (onDecisionChange) {
      onDecisionChange(candidateId, status, note);
    }
  };

  // Danh sách ứng viên có thể thêm vào bảng so sánh
  const availableToAdd = useMemo(() => {
    const currentIds = new Set(selectedCandidates.map((c) => c.id));
    return allAvailableCandidates.filter((c) => !currentIds.has(c.id));
  }, [allAvailableCandidates, selectedCandidates]);

  // In / Xuất báo cáo
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div
      id="candidate-comparison-matrix-container"
      data-testid="candidate-comparison-matrix"
      className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 overflow-hidden"
    >
      {/* 1. Header Toolbar của Bảng so sánh */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-850">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm dark:bg-indigo-500">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Bảng so sánh ứng viên vòng cuối (Side-by-side Matrix)
              </h2>
              <span
                data-testid="selected-candidates-count-badge"
                className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/60 dark:text-indigo-300"
              >
                {`${selectedCandidates.length} / ${COMPARISON_CONSTRAINTS.MAX_CANDIDATES} ứng viên`}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Đối chiếu đa chiều khung năng lực, nhận xét Hội đồng và kỳ vọng đãi ngộ để ra quyết định tuyển dụng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Thêm ứng viên */}
          {selectedCandidates.length < COMPARISON_CONSTRAINTS.MAX_CANDIDATES && (
            <button
              type="button"
              data-testid="btn-add-candidate-to-compare"
              onClick={() => setIsAddPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50 hover:border-indigo-300 dark:border-indigo-800 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm ứng viên so sánh</span>
            </button>
          )}

          {/* Nút In / Xuất báo cáo */}
          <button
            type="button"
            data-testid="btn-print-comparison"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
            title="In hoặc xuất báo cáo đối chiếu ứng viên"
          >
            <Printer className="h-3.5 w-3.5 text-gray-500" />
            <span>In / Xuất PDF</span>
          </button>

          {/* Nút Đóng nếu hiển thị dạng modal */}
          {isModal && onClose && (
            <button
              type="button"
              data-testid="btn-close-comparison-modal"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Đóng bảng so sánh"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cảnh báo số lượng ứng viên < 2 */}
      {selectedCandidates.length < COMPARISON_CONSTRAINTS.MIN_CANDIDATES && (
        <div
          data-testid="min-candidates-warning"
          className="m-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            {`Vui lòng chọn ít nhất ${COMPARISON_CONSTRAINTS.MIN_CANDIDATES} ứng viên để kích hoạt chế độ đối chiếu đa chiều.`}
          </span>
        </div>
      )}

      {/* 2. Ma trận So sánh Dạng Cột (Side-by-side Matrix with Sticky Columns & Headers) */}
      <div className="relative overflow-x-auto max-h-[calc(85vh-120px)] border-t border-gray-100 dark:border-gray-800">
        <table className="w-full border-collapse text-left text-sm">
          {/* THEAD CỐ ĐỊNH PHÍA TRÊN (Sticky Top Header) */}
          <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-md shadow-xs dark:bg-gray-900/95">
            <tr>
              {/* Ô góc trên bên trái: Cố định cả cuộn dọc lẫn cuộn ngang */}
              <th
                scope="col"
                className="sticky left-0 top-0 z-30 min-w-[240px] md:min-w-[280px] border-b border-r border-gray-200 bg-gray-50/95 p-4 text-xs font-bold uppercase tracking-wider text-gray-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-850/95 dark:text-gray-300"
              >
                <div className="flex items-center justify-between">
                  <span>Trục tiêu chí đánh giá</span>
                  <Award className="h-4 w-4 text-indigo-500" />
                </div>
              </th>

              {/* Các cột thông tin ứng viên */}
              {selectedCandidates.map((candidate, index) => {
                const decisionConfig = getDecisionBadgeConfig(candidate.hiringDecision?.status);
                return (
                  <th
                    key={candidate.id}
                    scope="col"
                    data-testid={`candidate-column-header-${candidate.id}`}
                    className="min-w-[280px] md:min-w-[320px] max-w-[340px] border-b border-r border-gray-200 p-4 align-top dark:border-gray-800"
                  >
                    <div className="relative flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3 shadow-2xs dark:border-gray-800 dark:bg-gray-800/40">
                      {/* Nút Xóa ứng viên khỏi bảng so sánh */}
                      {selectedCandidates.length > COMPARISON_CONSTRAINTS.MIN_CANDIDATES && (
                        <button
                          type="button"
                          data-testid={`btn-remove-candidate-${candidate.id}`}
                          onClick={() => handleRemove(candidate.id)}
                          className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                          title="Bỏ ứng viên này khỏi bảng so sánh"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Header Ứng viên: Avatar + Họ tên + Mã */}
                      <div className="flex items-center gap-3 pr-6">
                        <div className="relative">
                          {candidate.avatarUrl ? (
                            <img
                              src={candidate.avatarUrl}
                              alt={candidate.fullName}
                              className="h-11 w-11 rounded-full object-cover ring-2 ring-indigo-500/30"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-sm font-bold text-white shadow-2xs">
                              {candidate.fullName.charAt(0)}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            data-testid={`candidate-name-${candidate.id}`}
                            className="truncate text-sm font-bold text-gray-900 dark:text-white"
                          >
                            {candidate.fullName}
                          </h3>
                          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            {candidate.candidateCode}
                          </p>
                        </div>
                      </div>

                      {/* Trạng thái quyết định tuyển dụng hiện tại */}
                      <div className="flex items-center justify-between border-t border-gray-200/60 pt-2 dark:border-gray-700/60">
                        <span className="text-[11px] text-gray-500">Quyết định:</span>
                        <span
                          data-testid={`candidate-decision-badge-${candidate.id}`}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${decisionConfig.containerClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${decisionConfig.badgeBg}`} />
                          {decisionConfig.label}
                        </span>
                      </div>
                    </div>
                  </th>
                );
              })}

              {/* Ô trống nếu chưa đủ 5 ứng viên (Cho phép click thêm nhanh) */}
              {selectedCandidates.length < COMPARISON_CONSTRAINTS.MAX_CANDIDATES && (
                <th
                  scope="col"
                  className="min-w-[180px] border-b border-dashed border-gray-300 p-4 align-middle text-center dark:border-gray-700"
                >
                  <button
                    type="button"
                    onClick={() => setIsAddPickerOpen(true)}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/30 p-4 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400 w-full"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Thêm ứng viên</span>
                  </button>
                </th>
              )}
            </tr>
          </thead>

          {/* TBODY CHỨA CÁC NHÓM TIÊU CHÍ SO SÁNH */}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* ========================================================
                NHÓM 1: THÔNG TIN CHUNG (AC 2)
            ======================================================== */}
            <tr className="bg-gray-100/70 dark:bg-gray-800/60">
              <th
                colSpan={selectedCandidates.length + (selectedCandidates.length < 5 ? 2 : 1)}
                className="p-3 text-xs font-bold text-gray-800 dark:text-gray-200"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCategory('GENERAL_INFO')}
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>I. THÔNG TIN CHUNG & KINH NGHIỆM</span>
                  </div>
                  <button type="button" className="text-gray-500 hover:text-gray-700">
                    {collapsedCategories.GENERAL_INFO ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </th>
            </tr>

            {!collapsedCategories.GENERAL_INFO && (
              <>
                {/* 1.1 Vị trí & Công ty hiện tại */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-gray-400" />
                      <span>Vị trí & Công ty hiện tại</span>
                    </div>
                  </th>
                  {selectedCandidates.map((cand) => (
                    <td
                      key={`curr-pos-${cand.id}`}
                      data-testid={`candidate-current-position-${cand.id}`}
                      className="border-r border-gray-200 p-3.5 text-xs text-gray-900 dark:border-gray-800 dark:text-gray-100"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {cand.currentTitle}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {cand.currentCompany}
                      </div>
                    </td>
                  ))}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 1.2 Tổng năm kinh nghiệm (Highlight nếu cao nhất) */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>Tổng năm kinh nghiệm</span>
                    </div>
                  </th>
                  {selectedCandidates.map((cand) => {
                    const isTop = isCandidateTopInCriterion(highlightMap, 'experienceYears', cand.id);
                    return (
                      <td
                        key={`exp-${cand.id}`}
                        data-testid={`candidate-experience-${cand.id}`}
                        className={`border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 transition-colors ${
                          isTop
                            ? 'bg-emerald-50/70 font-bold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{`${cand.experienceYears} năm`}</span>
                          {isTop && (
                            <span
                              data-testid={`badge-top-experience-${cand.id}`}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                            >
                              <Trophy className="h-3 w-3 text-emerald-600" />
                              Nhiều nhất
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 1.3 Trình độ học vấn & Bằng cấp */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                      <span>Trình độ học vấn</span>
                    </div>
                  </th>
                  {selectedCandidates.map((cand) => (
                    <td
                      key={`edu-${cand.id}`}
                      data-testid={`candidate-education-${cand.id}`}
                      className="border-r border-gray-200 p-3.5 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-300"
                    >
                      {cand.educationLevel}
                    </td>
                  ))}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 1.4 Điểm khớp sơ bộ CV */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-gray-400" />
                      <span>Điểm sơ lọc hồ sơ (Matching)</span>
                    </div>
                  </th>
                  {selectedCandidates.map((cand) => {
                    const isTop = isCandidateTopInCriterion(highlightMap, 'matchingScore', cand.id);
                    return (
                      <td
                        key={`match-${cand.id}`}
                        data-testid={`candidate-matching-score-${cand.id}`}
                        className={`border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 ${
                          isTop
                            ? 'bg-emerald-50/70 font-bold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{`${cand.matchingScore} / 100 điểm`}</span>
                          {isTop && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                              <Check className="h-3 w-3" /> Cao nhất
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>
              </>
            )}

            {/* ========================================================
                NHÓM 2: ĐÁNH GIÁ KHUNG NĂNG LỰC (AC 2 & AC 3: Highlights)
            ======================================================== */}
            <tr className="bg-gray-100/70 dark:bg-gray-800/60">
              <th
                colSpan={selectedCandidates.length + (selectedCandidates.length < 5 ? 2 : 1)}
                className="p-3 text-xs font-bold text-gray-800 dark:text-gray-200"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCategory('COMPETENCY')}
                >
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>II. ĐÁNH GIÁ KHUNG NĂNG LỰC (Thang điểm 1.0 - 5.0)</span>
                  </div>
                  <button type="button" className="text-gray-500 hover:text-gray-700">
                    {collapsedCategories.COMPETENCY ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </th>
            </tr>

            {!collapsedCategories.COMPETENCY && (
              <>
                {/* 2.1 Tiêu chí: Chuyên môn kỹ thuật (Technical) */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <span>1. Chuyên môn kỹ thuật</span>
                    <p className="text-[10px] font-normal text-gray-400">Kiến trúc, Code chất lượng, Giải thuật</p>
                  </th>
                  {selectedCandidates.map((cand) => {
                    const score = cand.competencyScores.technical;
                    const isTop = isCandidateTopInCriterion(highlightMap, 'technical', cand.id);
                    const colorCfg = getScoreColorClass(score);
                    return (
                      <td
                        key={`comp-tech-${cand.id}`}
                        data-testid={`competency-technical-${cand.id}`}
                        className={`border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 transition-colors ${
                          isTop
                            ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-400/50 dark:bg-emerald-950/40'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-bold ${colorCfg.text}`}>{`${score.toFixed(1)} / 5.0`}</span>
                          {isTop && (
                            <span
                              data-testid={`badge-top-technical-${cand.id}`}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs"
                            >
                              <Trophy className="h-3 w-3 text-amber-300" />
                              Điểm cao nhất
                            </span>
                          )}
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full ${isTop ? 'bg-emerald-500' : colorCfg.progress}`}
                            style={{ width: `${getScorePercentage(score)}%` }}
                          />
                        </div>
                      </td>
                    );
                  })}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 2.2 Tiêu chí: Thái độ & Tác phong (Attitude) */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <span>2. Thái độ & Trách nhiệm</span>
                    <p className="text-[10px] font-normal text-gray-400">Tinh thần cầu thị, Tác phong công việc</p>
                  </th>
                  {selectedCandidates.map((cand) => {
                    const score = cand.competencyScores.attitude;
                    const isTop = isCandidateTopInCriterion(highlightMap, 'attitude', cand.id);
                    const colorCfg = getScoreColorClass(score);
                    return (
                      <td
                        key={`comp-att-${cand.id}`}
                        data-testid={`competency-attitude-${cand.id}`}
                        className={`border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 transition-colors ${
                          isTop
                            ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-400/50 dark:bg-emerald-950/40'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-bold ${colorCfg.text}`}>{`${score.toFixed(1)} / 5.0`}</span>
                          {isTop && (
                            <span
                              data-testid={`badge-top-attitude-${cand.id}`}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs"
                            >
                              <Trophy className="h-3 w-3 text-amber-300" />
                              Điểm cao nhất
                            </span>
                          )}
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full ${isTop ? 'bg-emerald-500' : colorCfg.progress}`}
                            style={{ width: `${getScorePercentage(score)}%` }}
                          />
                        </div>
                      </td>
                    );
                  })}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 2.3 Tiêu chí: Ngoại ngữ (Language) */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <span>3. Ngoại ngữ (Tiếng Anh)</span>
                    <p className="text-[10px] font-normal text-gray-400">Giao tiếp, Đọc hiểu tài liệu quốc tế</p>
                  </th>
                  {selectedCandidates.map((cand) => {
                    const score = cand.competencyScores.language;
                    const isTop = isCandidateTopInCriterion(highlightMap, 'language', cand.id);
                    const colorCfg = getScoreColorClass(score);
                    return (
                      <td
                        key={`comp-lang-${cand.id}`}
                        data-testid={`competency-language-${cand.id}`}
                        className={`border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 transition-colors ${
                          isTop
                            ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-400/50 dark:bg-emerald-950/40'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-bold ${colorCfg.text}`}>{`${score.toFixed(1)} / 5.0`}</span>
                          {isTop && (
                            <span
                              data-testid={`badge-top-language-${cand.id}`}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs"
                            >
                              <Trophy className="h-3 w-3 text-amber-300" />
                              Điểm cao nhất
                            </span>
                          )}
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full ${isTop ? 'bg-emerald-500' : colorCfg.progress}`}
                            style={{ width: `${getScorePercentage(score)}%` }}
                          />
                        </div>
                      </td>
                    );
                  })}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 2.4 Tiêu chí: Văn hóa phù hợp (Culture Fit) */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <span>4. Phù hợp văn hóa</span>
                    <p className="text-[10px] font-normal text-gray-400">Giá trị cốt lõi, Định hướng gắn bó lâu dài</p>
                  </th>
                  {selectedCandidates.map((cand) => {
                    const score = cand.competencyScores.cultureFit;
                    const isTop = isCandidateTopInCriterion(highlightMap, 'cultureFit', cand.id);
                    const colorCfg = getScoreColorClass(score);
                    return (
                      <td
                        key={`comp-cul-${cand.id}`}
                        data-testid={`competency-culture-fit-${cand.id}`}
                        className={`border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 transition-colors ${
                          isTop
                            ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-400/50 dark:bg-emerald-950/40'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-bold ${colorCfg.text}`}>{`${score.toFixed(1)} / 5.0`}</span>
                          {isTop && (
                            <span
                              data-testid={`badge-top-culture-fit-${cand.id}`}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs"
                            >
                              <Trophy className="h-3 w-3 text-amber-300" />
                              Điểm cao nhất
                            </span>
                          )}
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full ${isTop ? 'bg-emerald-500' : colorCfg.progress}`}
                            style={{ width: `${getScorePercentage(score)}%` }}
                          />
                        </div>
                      </td>
                    );
                  })}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 2.5 Tiêu chí: Kỹ năng mềm & Teamwork */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <span>5. Kỹ năng mềm & Làm việc nhóm</span>
                    <p className="text-[10px] font-normal text-gray-400">Giao tiếp liên phòng ban, Quản lý xung đột</p>
                  </th>
                  {selectedCandidates.map((cand) => {
                    const score = cand.competencyScores.softSkills;
                    const isTop = isCandidateTopInCriterion(highlightMap, 'softSkills', cand.id);
                    const colorCfg = getScoreColorClass(score);
                    return (
                      <td
                        key={`comp-soft-${cand.id}`}
                        data-testid={`competency-soft-skills-${cand.id}`}
                        className={`border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 transition-colors ${
                          isTop
                            ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-400/50 dark:bg-emerald-950/40'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-bold ${colorCfg.text}`}>{`${score.toFixed(1)} / 5.0`}</span>
                          {isTop && (
                            <span
                              data-testid={`badge-top-soft-skills-${cand.id}`}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs"
                            >
                              <Trophy className="h-3 w-3 text-amber-300" />
                              Điểm cao nhất
                            </span>
                          )}
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full ${isTop ? 'bg-emerald-500' : colorCfg.progress}`}
                            style={{ width: `${getScorePercentage(score)}%` }}
                          />
                        </div>
                      </td>
                    );
                  })}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 2.6 ĐIỂM TRUNG BÌNH TỔNG THỂ (Overall Score Highlight) */}
                <tr className="bg-indigo-50/40 dark:bg-indigo-950/20 font-semibold">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-indigo-50/90 p-4 text-xs font-bold text-indigo-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-indigo-950/80 dark:text-indigo-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-indigo-600 fill-indigo-600" />
                      <span>ĐIỂM TRUNG BÌNH TỔNG HỢP</span>
                    </div>
                    <p className="text-[10px] font-normal text-indigo-700/80 dark:text-indigo-300/80">
                      Tổng hợp toàn bộ khung năng lực
                    </p>
                  </th>
                  {selectedCandidates.map((cand) => {
                    const overallScore = cand.competencyScores.overall;
                    const isTop = isCandidateTopInCriterion(highlightMap, 'overall', cand.id);
                    return (
                      <td
                        key={`overall-${cand.id}`}
                        data-testid={`competency-overall-${cand.id}`}
                        className={`border-r border-gray-200 p-4 text-xs dark:border-gray-800 transition-all ${
                          isTop
                            ? 'bg-emerald-100/90 text-emerald-950 ring-2 ring-emerald-500/80 dark:bg-emerald-950/70 dark:text-emerald-100'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-extrabold text-indigo-950 dark:text-white">
                              {overallScore.toFixed(2)}
                            </span>
                            {isTop && (
                              <span
                                data-testid={`badge-top-overall-${cand.id}`}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs"
                              >
                                <Trophy className="h-3.5 w-3.5 text-amber-300" />
                                TOP 1 NĂNG LỰC
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${
                                  overallScore >= star
                                    ? 'fill-amber-400 text-amber-400'
                                    : overallScore >= star - 0.5
                                    ? 'fill-amber-300/50 text-amber-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>
              </>
            )}

            {/* ========================================================
                NHÓM 3: ĐÁNH GIÁ TỔNG HỢP TỪ HỘI ĐỒNG PHỎNG VẤN (AC 2)
            ======================================================== */}
            <tr className="bg-gray-100/70 dark:bg-gray-800/60">
              <th
                colSpan={selectedCandidates.length + (selectedCandidates.length < 5 ? 2 : 1)}
                className="p-3 text-xs font-bold text-gray-800 dark:text-gray-200"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCategory('FEEDBACK')}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>III. ĐÁNH GIÁ TỔNG HỢP TỪ HỘI ĐỒNG PHỎNG VẤN</span>
                  </div>
                  <button type="button" className="text-gray-500 hover:text-gray-700">
                    {collapsedCategories.FEEDBACK ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </th>
            </tr>

            {!collapsedCategories.FEEDBACK && (
              <>
                {/* 3.1 Nhận xét chi tiết từ từng Interviewer */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 align-top"
                  >
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5 text-gray-400" />
                      <span>Nhận xét từ người phỏng vấn</span>
                    </div>
                  </th>
                  {selectedCandidates.map((cand) => (
                    <td
                      key={`feedbacks-${cand.id}`}
                      data-testid={`candidate-feedbacks-${cand.id}`}
                      className="border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 align-top"
                    >
                      <div className="space-y-3">
                        {cand.interviewerFeedbacks.map((fb, idx) => {
                          const badgeCfg = getRecommendationBadgeConfig(fb.conclusion);
                          return (
                            <div
                              key={fb.interviewerId || idx}
                              className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-2xs dark:border-gray-750 dark:bg-gray-800"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {fb.interviewerName}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${badgeCfg.containerClass}`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${badgeCfg.dotClass}`} />
                                  {badgeCfg.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                                {fb.interviewerRole}
                              </p>
                              <p className="text-xs text-gray-700 italic dark:text-gray-300">
                                &ldquo;{fb.comment}&rdquo;
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 3.2 Điểm mạnh nổi bật (Strengths) */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 align-top"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Điểm mạnh chính</span>
                    </div>
                  </th>
                  {selectedCandidates.map((cand) => (
                    <td
                      key={`strengths-${cand.id}`}
                      data-testid={`candidate-strengths-${cand.id}`}
                      className="border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 align-top"
                    >
                      <ul className="space-y-1.5 text-gray-700 dark:text-gray-300">
                        {cand.summaryStrengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 3.3 Điểm cần lưu ý / Rủi ro (Concerns) */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 align-top"
                  >
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Điểm cần lưu ý / Rủi ro</span>
                    </div>
                  </th>
                  {selectedCandidates.map((cand) => (
                    <td
                      key={`concerns-${cand.id}`}
                      data-testid={`candidate-concerns-${cand.id}`}
                      className="border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 align-top"
                    >
                      <ul className="space-y-1.5 text-gray-700 dark:text-gray-300">
                        {cand.summaryConcerns.map((con, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>
              </>
            )}

            {/* ========================================================
                NHÓM 4: KỲ VỌNG ĐÃI NGỘ & THỜI GIAN NHẬN VIỆC (AC 2)
            ======================================================== */}
            <tr className="bg-gray-100/70 dark:bg-gray-800/60">
              <th
                colSpan={selectedCandidates.length + (selectedCandidates.length < 5 ? 2 : 1)}
                className="p-3 text-xs font-bold text-gray-800 dark:text-gray-200"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCategory('COMPENSATION')}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>IV. KỲ VỌNG ĐÃI NGỘ & THỜI GIAN BẮT ĐẦU LÀM VIỆC</span>
                  </div>
                  <button type="button" className="text-gray-500 hover:text-gray-700">
                    {collapsedCategories.COMPENSATION ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </th>
            </tr>

            {!collapsedCategories.COMPENSATION && (
              <>
                {/* 4.1 Mức lương đề xuất của ứng viên */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                      <span>Mức lương kỳ vọng</span>
                    </div>
                  </th>
                  {selectedCandidates.map((cand) => (
                    <td
                      key={`exp-sal-${cand.id}`}
                      data-testid={`candidate-expected-salary-${cand.id}`}
                      className="border-r border-gray-200 p-3.5 text-xs dark:border-gray-800"
                    >
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {cand.compensation.expectedSalaryFormatted}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {cand.compensation.salaryNegotiable ? 'Có thể thương lượng' : 'Cố định'}
                      </div>
                    </td>
                  ))}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 4.2 Mức lương hiện tại */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <span>Mức lương hiện tại</span>
                  </th>
                  {selectedCandidates.map((cand) => (
                    <td
                      key={`curr-sal-${cand.id}`}
                      data-testid={`candidate-current-salary-${cand.id}`}
                      className="border-r border-gray-200 p-3.5 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-300"
                    >
                      {cand.compensation.currentSalaryFormatted || 'Chưa cung cấp'}
                    </td>
                  ))}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 4.3 Thời gian có thể bắt đầu làm việc */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>Thời gian bắt đầu làm việc</span>
                    </div>
                  </th>
                  {selectedCandidates.map((cand) => {
                    const isImmediate = cand.compensation.noticePeriodDays === 0;
                    return (
                      <td
                        key={`avail-${cand.id}`}
                        data-testid={`candidate-availability-${cand.id}`}
                        className={`border-r border-gray-200 p-3.5 text-xs dark:border-gray-800 ${
                          isImmediate
                            ? 'bg-emerald-50/60 font-semibold text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{cand.compensation.availabilityText}</span>
                          {isImmediate && (
                            <span
                              data-testid={`badge-immediate-start-${cand.id}`}
                              className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                            >
                              Onboard ngay
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>

                {/* 4.4 Hình thức làm việc mong muốn */}
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-gray-200 bg-white p-3.5 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <span>Hình thức làm việc</span>
                  </th>
                  {selectedCandidates.map((cand) => (
                    <td
                      key={`mode-${cand.id}`}
                      data-testid={`candidate-work-mode-${cand.id}`}
                      className="border-r border-gray-200 p-3.5 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-300"
                    >
                      <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {cand.compensation.workModePreference === 'HYBRID'
                          ? 'Hybrid (Linh hoạt)'
                          : cand.compensation.workModePreference === 'REMOTE'
                          ? 'Remote (Từ xa)'
                          : 'Onsite (Tại văn phòng)'}
                      </span>
                    </td>
                  ))}
                  {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
                </tr>
              </>
            )}

            {/* ========================================================
                NHÓM 5: HÀNH ĐỘNG RA QUYẾT ĐỊNH TUYỂN DỤNG
            ======================================================== */}
            <tr className="bg-gray-100/70 dark:bg-gray-800/60">
              <th
                colSpan={selectedCandidates.length + (selectedCandidates.length < 5 ? 2 : 1)}
                className="p-3 text-xs font-bold text-gray-800 dark:text-gray-200"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCategory('DECISION')}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>V. HÀNH ĐỘNG & RA QUYẾT ĐỊNH TUYỂN DỤNG</span>
                  </div>
                  <button type="button" className="text-gray-500 hover:text-gray-700">
                    {collapsedCategories.DECISION ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </th>
            </tr>

            {!collapsedCategories.DECISION && (
              <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-gray-200 bg-white p-4 text-xs font-semibold text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 align-top"
                >
                  <span>Thao tác Hội đồng</span>
                  <p className="text-[10px] font-normal text-gray-400">Chọn phương án cho từng ứng viên</p>
                </th>
                {selectedCandidates.map((cand) => {
                  const currentStatus = cand.hiringDecision?.status || 'PENDING';
                  return (
                    <td
                      key={`action-${cand.id}`}
                      data-testid={`candidate-actions-${cand.id}`}
                      className="border-r border-gray-200 p-4 text-xs dark:border-gray-800 align-top"
                    >
                      <div className="flex flex-col gap-2">
                        {/* Nút Đề xuất Offer */}
                        <button
                          type="button"
                          data-testid={`btn-decision-offer-${cand.id}`}
                          onClick={() => handleMakeDecision(cand.id, 'OFFER')}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all shadow-2xs ${
                            currentStatus === 'OFFER'
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{currentStatus === 'OFFER' ? '✓ Đã chọn Offer' : 'Chọn Tuyển dụng (Offer)'}</span>
                        </button>

                        {/* Nút Đưa vào Dự phòng Talent Pool */}
                        <button
                          type="button"
                          data-testid={`btn-decision-backup-${cand.id}`}
                          onClick={() => handleMakeDecision(cand.id, 'BACKUP')}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            currentStatus === 'BACKUP'
                              ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Dự phòng (Talent Pool)</span>
                        </button>

                        {/* Nút Từ chối */}
                        <button
                          type="button"
                          data-testid={`btn-decision-reject-${cand.id}`}
                          onClick={() => handleMakeDecision(cand.id, 'REJECT')}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            currentStatus === 'REJECT'
                              ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                              : 'text-gray-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-400'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Chưa phù hợp</span>
                        </button>
                      </div>
                    </td>
                  );
                })}
                {selectedCandidates.length < 5 && <td className="border-r border-gray-200 dark:border-gray-800" />}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Modal / Popup Thêm ứng viên so sánh */}
      {isAddPickerOpen && (
        <div
          data-testid="add-candidate-picker-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Chọn ứng viên thêm vào bảng so sánh
                </h3>
              </div>
              <button
                type="button"
                data-testid="btn-close-add-picker"
                onClick={() => setIsAddPickerOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Danh sách các ứng viên xuất sắc khác ở vòng phỏng vấn cuối cùng (tối đa 5 ứng viên song song).
            </p>

            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
              {availableToAdd.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  Không còn ứng viên nào khác khả dụng để thêm.
                </div>
              ) : (
                availableToAdd.map((candidate) => (
                  <div
                    key={candidate.id}
                    data-testid={`available-candidate-item-${candidate.id}`}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-3 hover:bg-indigo-50/50 dark:border-gray-800 dark:bg-gray-800/40"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {candidate.fullName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {candidate.currentTitle} • {candidate.experienceYears} năm kinh nghiệm
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid={`btn-select-candidate-${candidate.id}`}
                      onClick={() => handleAdd(candidate)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Thêm</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddPickerOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateComparisonMatrix;
