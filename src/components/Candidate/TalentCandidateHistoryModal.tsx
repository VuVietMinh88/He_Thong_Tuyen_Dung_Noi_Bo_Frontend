import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  FileText,
  Clock,
  Briefcase,
  CheckCircle2,
  Calendar,
  Loader2,
  Tag,
} from 'lucide-react';
import type {
  TalentPoolCandidateSuggestion,
  TalentPoolCandidateHistory,
} from '../../types/talentPool';
import { talentPoolService } from '../../services/talentPoolService';

export interface TalentCandidateHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: TalentPoolCandidateSuggestion | null;
}

export const TalentCandidateHistoryModal: React.FC<TalentCandidateHistoryModalProps> = ({
  isOpen,
  onClose,
  candidate,
}) => {
  const [history, setHistory] = useState<TalentPoolCandidateHistory | null>(() => {
    if (!candidate) return null;
    return {
      candidateId: candidate.candidateId || candidate.id,
      candidateName: candidate.fullName,
      addedAt: candidate.addedToPoolAt || '2026-08-15T10:00:00Z',
      addedBy: 'Chuyên viên Tuyển dụng (Recruiter)',
      category: candidate.category,
      recruiterNotes: candidate.notes || 'Chưa có ghi chú chi tiết.',
      tags: candidate.skills || [],
      contactRecommendation: candidate.contactRecommendation || 'Sau 3 tháng',
      previousApplication: {
        jobTitle: candidate.previousAppliedJobTitle || 'Lập trình viên React Senior',
        department: 'Khối Công nghệ & Sản phẩm',
        appliedAt: '2026-07-01T08:30:00Z',
        lastStage: 'Vòng Phỏng vấn Chuyên môn',
        interviewNotes: 'Pass 3/3 tiêu chí bắt buộc. Văn hóa công ty rất phù hợp.',
      },
    };
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && candidate) {
      setIsLoading(true);
      talentPoolService
        .getTalentPoolCandidateHistory(candidate.candidateId || candidate.id)
        .then((res) => {
          if (isMounted) {
            setHistory(res);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, candidate]);

  if (!isOpen || !candidate) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="talent-history-modal-title"
      data-testid="talent-candidate-history-modal"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 sm:my-8">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h3
                id="talent-history-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Lịch sử Đánh giá & Ghi chú Kho tiềm năng
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Thông tin nhận xét năng lực và dữ liệu phỏng vấn từ các đợt ứng tuyển trước
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-history-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nội dung Modal */}
        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
              Đang tải dữ liệu lịch sử ứng viên...
            </div>
          ) : (
            <>
              {/* Thẻ ứng viên */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 dark:border-slate-800 dark:bg-slate-950/40">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {candidate.fullName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {candidate.email} • {candidate.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {candidate.category}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {`${candidate.experienceYears} năm KN`}
                  </p>
                </div>
              </div>

              {/* Đợt ứng tuyển gần nhất */}
              {history?.previousApplication && (
                <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    <Briefcase className="h-4 w-4 text-indigo-600" />
                    <span>Hồ sơ ứng tuyển gần nhất</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      <strong>Vị trí:</strong> {history.previousApplication.jobTitle}
                    </p>
                    <p>
                      <strong>Phòng ban:</strong> {history.previousApplication.department}
                    </p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Ngày nộp: {new Date(history.previousApplication.appliedAt).toLocaleDateString('vi-VN')}</span>
                      <span className="mx-1">•</span>
                      <span className="text-indigo-600 font-semibold">{history.previousApplication.lastStage}</span>
                    </p>
                    {history.previousApplication.interviewNotes && (
                      <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {history.previousApplication.interviewNotes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nhận xét của Recruiter khi lưu vào kho */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Ghi chú của Recruiter khi lưu vào kho</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Bởi: {history?.addedBy || 'Chuyên viên tuyển dụng'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {history?.recruiterNotes || candidate.notes || 'Chưa có ghi chú chi tiết.'}
                </p>

                {/* Mốc liên hệ lại đề xuất */}
                {(history?.contactRecommendation || candidate.contactRecommendation) && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-semibold">Thời điểm nên liên hệ lại:</span>
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {history?.contactRecommendation || candidate.contactRecommendation}
                    </span>
                  </div>
                )}
              </div>

              {/* Kỹ năng & Tags nổi bật */}
              <div>
                <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  Kỹ năng chuyên môn trong kho
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(history?.tags || candidate.skills).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-end border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            type="button"
            data-testid="close-history-btn"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default TalentCandidateHistoryModal;
