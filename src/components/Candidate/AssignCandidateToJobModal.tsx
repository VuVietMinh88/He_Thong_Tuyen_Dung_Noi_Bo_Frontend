import React, { useState, useId } from 'react';
import {
  X,
  UserPlus,
  Briefcase,
  Layers,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { TalentPoolCandidateSuggestion } from '../../types/talentPool';
import { talentPoolService } from '../../services/talentPoolService';
import { toast } from '../notifications';

export interface AssignCandidateToJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: TalentPoolCandidateSuggestion | null;
  selectedJobId?: string;
  selectedJobTitle?: string;
  jobOptions?: Array<{ id: string; title: string }>;
  onSuccess?: (updatedCandidate: TalentPoolCandidateSuggestion) => void;
}

const RECRUITMENT_STAGES = [
  { value: 'SCREENING', label: '1. Sàng lọc hồ sơ (Screening)' },
  { value: 'TECHNICAL_TEST', label: '2. Bài kiểm tra kỹ thuật (Technical Test)' },
  { value: 'ROUND_1', label: '3. Phỏng vấn vòng 1 (Vòng Kỹ thuật)' },
  { value: 'ROUND_2', label: '4. Phỏng vấn vòng 2 (Văn hóa & Ban Giám đốc)' },
  { value: 'OFFER', label: '5. Đề xuất tuyển dụng (Offer)' },
];

export const AssignCandidateToJobModal: React.FC<AssignCandidateToJobModalProps> = ({
  isOpen,
  onClose,
  candidate,
  selectedJobId: initialJobId,
  selectedJobTitle: initialJobTitle,
  jobOptions = [],
  onSuccess,
}) => {
  const jobSelectId = useId();
  const stageSelectId = useId();
  const notesId = useId();

  const [jobId, setJobId] = useState<string>(initialJobId || (jobOptions[0]?.id ?? ''));
  const [initialStage, setInitialStage] = useState<string>('SCREENING');
  const [notes, setNotes] = useState<string>(
    'Ứng viên tiềm năng từ kho talent pool, có kỹ năng và đánh giá tốt. Tái kích hoạt vào vòng tuyển dụng mới.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !candidate) return null;

  const resolvedJobTitle =
    jobOptions.find((j) => j.id === jobId)?.title || initialJobTitle || 'Tin tuyển dụng mới';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobId) {
      setErrorMessage('Vui lòng chọn vị trí tuyển dụng để gán ứng viên');
      return;
    }
    if (!initialStage) {
      setErrorMessage('Vui lòng chọn vòng tuyển dụng khởi đầu');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const updated = await talentPoolService.assignCandidateToJob({
        candidateId: candidate.candidateId || candidate.id,
        jobId,
        jobTitle: resolvedJobTitle,
        initialStage,
        notes: notes.trim(),
      });

      toast.success(
        `Đã gán ứng viên ${candidate.fullName} vào vị trí "${resolvedJobTitle}"`
      );

      if (onSuccess) {
        onSuccess(updated);
      }

      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi gán ứng viên vào vị trí';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-candidate-modal-title"
      data-testid="assign-candidate-to-job-modal"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 sm:my-8">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h3
                id="assign-candidate-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Mời ứng tuyển & Gán vào Vòng tuyển dụng
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Tái kích hoạt ứng viên từ kho tiềm năng vào quy trình tuyển dụng trực tiếp
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-assign-modal-btn"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tóm tắt ứng viên được chọn */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {candidate.fullName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {candidate.email} • {candidate.experienceYears} năm kinh nghiệm
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {`${candidate.matchScore}% phù hợp`}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">{candidate.category}</p>
              </div>
            </div>
          </div>

          {/* Chọn Vị trí tuyển dụng */}
          <div>
            <label
              htmlFor={jobSelectId}
              className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Vị trí tuyển dụng mục tiêu <span className="text-rose-500">*</span>
            </label>
            {jobOptions.length > 0 ? (
              <select
                id={jobSelectId}
                data-testid="target-job-select"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                <span className="font-semibold">{resolvedJobTitle}</span>
              </div>
            )}
          </div>

          {/* Chọn Vòng tuyển dụng khởi đầu */}
          <div>
            <label
              htmlFor={stageSelectId}
              className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Vòng tuyển dụng khởi đầu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id={stageSelectId}
                data-testid="initial-stage-select"
                value={initialStage}
                onChange={(e) => setInitialStage(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {RECRUITMENT_STAGES.map((stg) => (
                  <option key={stg.value} value={stg.value}>
                    {stg.label}
                  </option>
                ))}
              </select>
              <Layers className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Ứng viên có thể được đưa thẳng vào vòng phỏng vấn chuyên môn nếu đã vượt qua vòng sơ loại trước đó.
            </p>
          </div>

          {/* Ghi chú tái kích hoạt */}
          <div>
            <label
              htmlFor={notesId}
              className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
            >
              Ghi chú kích hoạt / Lý do đề xuất
            </label>
            <div className="relative">
              <textarea
                id={notesId}
                data-testid="assign-notes-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập ghi chú cho Hội đồng tuyển dụng..."
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <FileText className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {errorMessage && (
            <div
              data-testid="assign-error-message"
              className="flex items-center gap-1.5 rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Modal */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              data-testid="cancel-assign-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              data-testid="confirm-assign-btn"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Xác nhận gán vào vòng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignCandidateToJobModal;
