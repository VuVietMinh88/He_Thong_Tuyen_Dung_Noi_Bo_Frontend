import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Printer,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Archive,
  Radar,
  BarChart3,
  DollarSign,
  Sparkles,
  Trophy,
  Loader2,
  FileCheck,
} from 'lucide-react';
import type {
  CandidateEvaluationSummaryData,
  FinalHiringDecisionRecord,
  FinalHiringDecisionStatus,
} from '../../../types/candidateEvaluationSummary';
import { candidateEvaluationSummaryService } from '../../../services/candidateEvaluationSummaryService';
import { ConsensusGaugeCard } from './ConsensusGaugeCard';
import { CompetencyRadarChart } from './CompetencyRadarChart';
import { CompetencyBarChart } from './CompetencyBarChart';
import { RoundEvaluationAccordion } from './RoundEvaluationAccordion';
import { FinalHiringDecisionModal } from '../Decision/FinalHiringDecisionModal';
import { getDecisionStatusBadgeConfig } from '../../../utils/candidateEvaluationSummaryHelper';

export interface CandidateEvaluationSummaryViewProps {
  candidateId?: string;
  initialData?: CandidateEvaluationSummaryData;
  onBack?: () => void;
  onDecisionUpdated?: (decision: FinalHiringDecisionRecord) => void;
  isModal?: boolean;
}

export const CandidateEvaluationSummaryView: React.FC<CandidateEvaluationSummaryViewProps> = ({
  candidateId,
  initialData,
  onBack,
  onDecisionUpdated,
  isModal: _isModal = false,
}) => {
  const [summaryData, setSummaryData] = useState<CandidateEvaluationSummaryData | null>(
    initialData || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [chartMode, setChartMode] = useState<'RADAR' | 'BAR'>('RADAR');
  const [activeDecisionModal, setActiveDecisionModal] = useState<FinalHiringDecisionStatus | null>(
    null
  );

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await candidateEvaluationSummaryService.getCandidateEvaluationSummary(candidateId);
      setSummaryData(data);
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ tổng hợp đánh giá:', err);
    } finally {
      setIsLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    if (!initialData) {
      fetchSummary();
    }
  }, [fetchSummary, initialData]);

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitDecision = (decision: FinalHiringDecisionRecord) => {
    if (!summaryData) return;
    setSummaryData((prev) =>
      prev
        ? {
            ...prev,
            hiringDecision: {
              ...decision,
              decidedAt: decision.decidedAt || new Date().toISOString(),
            },
          }
        : prev
    );
    if (onDecisionUpdated) {
      onDecisionUpdated(decision);
    }
  };

  if (isLoading || !summaryData) {
    return (
      <div
        data-testid="evaluation-summary-loading"
        className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center"
      >
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Đang tải hồ sơ tổng hợp kết quả đánh giá toàn diện...
        </p>
      </div>
    );
  }

  const decisionBadge = getDecisionStatusBadgeConfig(summaryData.hiringDecision.status);

  // Thống kê số lượng tiêu chí vượt chuẩn, đạt chuẩn, dưới chuẩn
  const gapCounts = {
    exceeds: summaryData.competencyBenchmarks.filter((b) => b.gapStatus === 'EXCEEDS').length,
    meets: summaryData.competencyBenchmarks.filter((b) => b.gapStatus === 'MEETS').length,
    below: summaryData.competencyBenchmarks.filter((b) => b.gapStatus === 'BELOW').length,
  };

  return (
    <div
      data-testid="candidate-evaluation-summary-view"
      className="flex flex-col min-h-full bg-slate-50 dark:bg-gray-950 pb-28 text-slate-800 dark:text-slate-100"
    >
      {/* 1. Header Toolbar & Thông tin ứng viên (AC 1) */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 px-6 py-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90 shadow-2xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                data-testid="btn-back-to-candidates"
                onClick={onBack}
                className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-750 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer shadow-2xs"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  HỒ SƠ TỔNG HỢP ĐÁNH GIÁ (S7-02)
                </span>
                <span
                  data-testid="header-decision-status-badge"
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${decisionBadge.containerClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${decisionBadge.dotClass}`} />
                  <span>{decisionBadge.label}</span>
                </span>
              </div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white mt-1">
                {summaryData.fullName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Nút In / Xuất PDF */}
            <button
              type="button"
              data-testid="btn-print-evaluation-summary"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-gray-500" />
              <span>In / Xuất Báo cáo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Container Nội dung chính */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Card Thông tin ứng viên tổng quan (Header Profile Card) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              {summaryData.avatarUrl ? (
                <img
                  src={summaryData.avatarUrl}
                  alt={summaryData.fullName}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-md"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white shadow-md">
                  {summaryData.fullName.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {summaryData.fullName}
                  </h2>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {summaryData.candidateCode}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{summaryData.appliedJobTitle}</span>
                  </span>
                  <span>•</span>
                  <span>{`${summaryData.currentCompany} (${summaryData.experienceYears} năm KN)`}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                    <span>{summaryData.educationLevel}</span>
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{summaryData.email}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{summaryData.phone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Phòng ban: {summaryData.departmentName}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Điểm số tổng hợp Overall Score nổi bật */}
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/70 p-4 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Trophy className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  ĐIỂM NĂNG LỰC TỔNG THỂ
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span
                    data-testid="header-overall-score"
                    className="text-2xl font-black text-indigo-900 dark:text-white"
                  >
                    {summaryData.overallScore.toFixed(2)}
                  </span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                    / 5.0
                  </span>
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 ml-1">
                    {`${summaryData.overallPercentage.toFixed(0)}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Phần tỷ lệ đồng thuận của Hội đồng (AC 1) */}
        <ConsensusGaugeCard
          consensus={summaryData.consensus}
          overallScore={summaryData.overallScore}
        />

        {/* 4. Phần Biểu đồ mạng nhện / Thanh năng lực (AC 3) */}
        <div
          data-testid="competency-chart-section"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900"
        >
          {/* Header biểu đồ & Chuyển đổi chế độ xem */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Đối chiếu năng lực thực tế so với Chuẩn kỳ vọng vị trí</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Phân tích mức độ đáp ứng theo 6 trục năng lực cốt lõi (Benchmark Gap Analysis)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Thống kê nhanh Gap */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
                <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {`${gapCounts.exceeds} Vượt chuẩn`}
                </span>
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                  {`${gapCounts.meets} Đạt chuẩn`}
                </span>
                {gapCounts.below > 0 && (
                  <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                    {`${gapCounts.below} Dưới chuẩn`}
                  </span>
                )}
              </div>

              {/* Tabs chuyển chế độ: Radar vs Bar */}
              <div
                className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800"
                role="tablist"
              >
                <button
                  type="button"
                  data-testid="btn-mode-radar"
                  onClick={() => setChartMode('RADAR')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    chartMode === 'RADAR'
                      ? 'bg-white text-indigo-700 shadow-xs dark:bg-gray-700 dark:text-indigo-300'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Radar className="h-3.5 w-3.5" />
                  <span>Biểu đồ mạng nhện</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-mode-bar"
                  onClick={() => setChartMode('BAR')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    chartMode === 'BAR'
                      ? 'bg-white text-indigo-700 shadow-xs dark:bg-gray-700 dark:text-indigo-300'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Thanh so sánh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Render chế độ xem được chọn */}
          <div className="mt-4">
            {chartMode === 'RADAR' ? (
              <CompetencyRadarChart
                benchmarks={summaryData.competencyBenchmarks}
                candidateName={summaryData.fullName}
              />
            ) : (
              <CompetencyBarChart benchmarks={summaryData.competencyBenchmarks} />
            )}
          </div>
        </div>

        {/* 5. Thông tin Kỳ vọng Đãi ngộ & Thời gian làm việc */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Kỳ vọng Đãi ngộ & Thời gian nhận việc
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Mức lương kỳ vọng:</span>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {summaryData.compensation.expectedSalaryFormatted}
              </div>
              <span className="text-[11px] text-gray-400 italic">
                {summaryData.compensation.salaryNegotiable ? 'Có thể thương lượng' : 'Cố định'}
              </span>
            </div>

            <div>
              <span className="text-gray-400">Mức lương hiện tại:</span>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                {summaryData.compensation.currentSalaryFormatted || 'Không tiết lộ'}
              </div>
            </div>

            <div>
              <span className="text-gray-400">Thời gian báo trước:</span>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                {`${summaryData.compensation.noticePeriodDays} ngày`}
              </div>
              <span className="text-[11px] text-gray-500">
                {summaryData.compensation.availabilityText}
              </span>
            </div>

            <div>
              <span className="text-gray-400">Hình thức làm việc:</span>
              <div className="mt-1">
                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {summaryData.compensation.workModePreference}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Chi tiết đánh giá theo từng vòng phỏng vấn (AC 2) */}
        <RoundEvaluationAccordion rounds={summaryData.evaluationRounds} />
      </div>

      {/* 7. Khu vực thao tác ra quyết định (Action CTA Section - AC 4) */}
      <div
        data-testid="decision-action-cta-section"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 px-6 py-3.5 backdrop-blur-md shadow-2xl dark:border-gray-800 dark:bg-gray-900/95"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  Quyết định của Hội đồng:
                </span>
                <span
                  data-testid="footer-decision-status-badge"
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${decisionBadge.containerClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${decisionBadge.dotClass}`} />
                  <span>{decisionBadge.label}</span>
                </span>
              </div>
              {summaryData.hiringDecision.decidedAt && (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {`Phê duyệt bởi: ${summaryData.hiringDecision.decidedBy || 'Hội đồng Tuyển dụng'} • Lương đề xuất: ${
                    summaryData.hiringDecision.offeredSalaryFormatted || 'Chưa cập nhật'
                  }`}
                </div>
              )}
            </div>
          </div>

          {/* Các nút hành động ra quyết định */}
          <div className="flex items-center gap-2.5">
            {/* 1. Nút Từ chối hồ sơ (Reject) */}
            <button
              type="button"
              data-testid="btn-decision-reject"
              onClick={() => setActiveDecisionModal('REJECT')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-100 hover:border-rose-300 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Từ chối hồ sơ (Reject)</span>
            </button>

            {/* 2. Nút Lưu trữ vào kho tiềm năng (Talent Pool) */}
            <button
              type="button"
              data-testid="btn-decision-talent-pool"
              onClick={() => setActiveDecisionModal('TALENT_POOL')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 shadow-2xs hover:bg-amber-100 hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 cursor-pointer"
            >
              <Archive className="h-4 w-4" />
              <span>Lưu trữ vào kho tiềm năng</span>
            </button>

            {/* 3. Nút Gửi đề nghị tuyển dụng (Make Offer) */}
            <button
              type="button"
              data-testid="btn-decision-make-offer"
              onClick={() => setActiveDecisionModal('OFFER')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 ring-2 ring-emerald-500/20 active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Gửi đề nghị tuyển dụng (Make Offer)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal nhập quyết định tuyển dụng */}
      {activeDecisionModal && (
        <FinalHiringDecisionModal
          isOpen={true}
          initialDecisionType={activeDecisionModal}
          candidateId={summaryData.id}
          candidateName={summaryData.fullName}
          candidateCode={summaryData.candidateCode}
          jobTitle={summaryData.appliedJobTitle}
          expectedSalary={summaryData.compensation.expectedSalary}
          expectedSalaryFormatted={summaryData.compensation.expectedSalaryFormatted}
          onClose={() => setActiveDecisionModal(null)}
          onSuccess={handleSubmitDecision}
        />
      )}
    </div>
  );
};

export default CandidateEvaluationSummaryView;
