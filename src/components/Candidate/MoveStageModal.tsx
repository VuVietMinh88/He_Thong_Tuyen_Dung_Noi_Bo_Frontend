import React, { useEffect, useState } from 'react';
import { CalendarDays, Loader2, UserRound, X } from 'lucide-react';
import type { CandidateStage } from '../../types/candidate';
import { CANDIDATE_STAGE_CONFIG } from '../../types/candidate';
import type { UserAccount } from '../../types/account';
import { userService } from '../../services/userService';
import { candidateStageService, type MoveCandidateStagePayload } from '../../services/candidateStageService';
import { toast } from '../notifications';

const SELECTABLE_STAGES: CandidateStage[] = [
  'NEW',
  'SCREENING',
  'INTERVIEWING',
  'OFFER',
  'HIRED',
];

export interface MoveStageModalProps {
  candidateId: string;
  candidateName: string;
  applicationId?: string;
  currentStage: CandidateStage;
  initialStage?: CandidateStage;
  onClose: () => void;
  onSuccess: (payload: MoveCandidateStagePayload) => void;
}

export const MoveStageModal: React.FC<MoveStageModalProps> = ({
  candidateId,
  candidateName,
  applicationId,
  currentStage,
  initialStage,
  onClose,
  onSuccess,
}) => {
  const [toStage, setToStage] = useState<CandidateStage>(
    initialStage && SELECTABLE_STAGES.includes(initialStage)
      ? initialStage
      : SELECTABLE_STAGES.find((stage) => stage !== currentStage) ?? 'NEW',
  );
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewerId, setInterviewerId] = useState('');
  const [interviewers, setInterviewers] = useState<UserAccount[]>([]);
  const [isLoadingInterviewers, setIsLoadingInterviewers] = useState(true);
  const [interviewerLoadError, setInterviewerLoadError] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;
    userService.getUsers({ limit: 100, role: 'INTERVIEWER', status: 'ACTIVE' })
      .then((response) => {
        if (isCurrent) setInterviewers(response.users);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setInterviewerLoadError(
            error instanceof Error ? error.message : 'Không thể tải danh sách người phỏng vấn.',
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingInterviewers(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedInterviewer = interviewers.find((user) => user.id === interviewerId);
    if (toStage === 'INTERVIEWING' && (!interviewDate || !selectedInterviewer)) {
      setErrorMessage('Vui lòng chọn lịch phỏng vấn và nhập người phỏng vấn.');
      return;
    }

    const payload: MoveCandidateStagePayload = {
      applicationId,
      toStage,
      ...(toStage === 'INTERVIEWING'
        ? {
            interviewDate: new Date(interviewDate).toISOString(),
            interviewerId: selectedInterviewer?.id,
            interviewer: selectedInterviewer?.fullName,
          }
        : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await candidateStageService.moveCandidateToStage(candidateId, payload);
      toast.success(`Đã chuyển ${candidateName} sang giai đoạn "${CANDIDATE_STAGE_CONFIG[toStage].label}".`);
      onSuccess(payload);
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể chuyển giai đoạn ứng viên.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-stage-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="move-stage-title" className="text-lg font-bold text-slate-900">Chuyển giai đoạn ứng viên</h2>
            <p className="mt-1 text-sm text-slate-500">{candidateName} · Hiện tại: {CANDIDATE_STAGE_CONFIG[currentStage].label}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label htmlFor="move-stage-target" className="mb-1.5 block text-sm font-semibold text-slate-700">Giai đoạn đích</label>
            <select
              id="move-stage-target"
              value={toStage}
              onChange={(event) => {
                setToStage(event.target.value as CandidateStage);
                setErrorMessage('');
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {SELECTABLE_STAGES.filter((stage) => stage !== currentStage).map((stage) => (
                <option key={stage} value={stage}>{CANDIDATE_STAGE_CONFIG[stage].label}</option>
              ))}
            </select>
          </div>

          {toStage === 'INTERVIEWING' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="move-stage-interview-date" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <CalendarDays className="h-4 w-4" /> Lịch phỏng vấn
                </label>
                <input
                  id="move-stage-interview-date"
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(event) => setInterviewDate(event.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label htmlFor="move-stage-interviewer" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <UserRound className="h-4 w-4" /> Người phỏng vấn
                </label>
                <select
                  id="move-stage-interviewer"
                  value={interviewerId}
                  onChange={(event) => setInterviewerId(event.target.value)}
                  required
                  disabled={isLoadingInterviewers || interviewers.length === 0}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="" disabled>
                    {isLoadingInterviewers ? 'Đang tải danh sách...' : 'Chọn người phỏng vấn'}
                  </option>
                  {interviewers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}{user.department ? ` · ${user.department}` : ''}
                    </option>
                  ))}
                </select>
                {interviewerLoadError && <p role="alert" className="mt-1 text-xs text-rose-600">{interviewerLoadError}</p>}
                {!isLoadingInterviewers && !interviewerLoadError && interviewers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700">Chưa có người phỏng vấn đang hoạt động.</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="move-stage-notes" className="mb-1.5 block text-sm font-semibold text-slate-700">Ghi chú (không bắt buộc)</label>
            <textarea
              id="move-stage-notes"
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Bổ sung thông tin cho lần chuyển giai đoạn này..."
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {errorMessage && <p role="alert" className="text-sm font-medium text-rose-600">{errorMessage}</p>}

          <footer className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận chuyển'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default MoveStageModal;
