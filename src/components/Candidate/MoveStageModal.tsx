import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Loader2, UserRound, X } from 'lucide-react';
import type { CandidateStage } from '../../types/candidate';
import { CANDIDATE_STAGE_CONFIG } from '../../types/candidate';
import type { UserAccount } from '../../types/account';
import { userService } from '../../services/userService';
import { tokenService } from '../../services/token.service';
import {
  candidateStageService,
  getSkippedCandidateStages,
  type MoveCandidateStagePayload,
} from '../../services/candidateStageService';
import {
  interviewEvaluationService,
  type InterviewResultStage,
} from '../../services/interviewEvaluationService';
import InterviewResultNotificationModal from './InterviewResultNotificationModal';
import { toast } from '../notifications';

const SELECTABLE_STAGES: CandidateStage[] = [
  'NEW',
  'SCREENING',
  'INTERVIEWING',
  'OFFER',
  'HIRED',
];

const getNextSelectableStage = (stage: CandidateStage): CandidateStage => {
  const nextIndex = SELECTABLE_STAGES.indexOf(stage) + 1;
  return SELECTABLE_STAGES[nextIndex]
    ?? SELECTABLE_STAGES.find((candidateStage) => candidateStage !== stage)
    ?? 'NEW';
};

export interface MoveStageModalProps {
  candidateId: string;
  candidateName: string;
  applicationId?: string;
  currentStage: CandidateStage;
  initialStage?: CandidateStage;
  allowException?: boolean;
  onClose: () => void;
  onSuccess: (payload: MoveCandidateStagePayload) => void;
}

export const MoveStageModal: React.FC<MoveStageModalProps> = ({
  candidateId,
  candidateName,
  applicationId,
  currentStage,
  initialStage,
  allowException = false,
  onClose,
  onSuccess,
}) => {
  const [toStage, setToStage] = useState<CandidateStage>(
    initialStage && SELECTABLE_STAGES.includes(initialStage)
      ? initialStage
      : getNextSelectableStage(currentStage),
  );
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewerId, setInterviewerId] = useState('');
  const [interviewers, setInterviewers] = useState<UserAccount[]>([]);
  const [isLoadingInterviewers, setIsLoadingInterviewers] = useState(true);
  const [interviewerLoadError, setInterviewerLoadError] = useState('');
  const [notes, setNotes] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [isExceptionConfirmed, setIsExceptionConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingResultPayload, setPendingResultPayload] =
    useState<MoveCandidateStagePayload | null>(null);
  const [pendingResultStage, setPendingResultStage] =
    useState<InterviewResultStage | null>(null);
  const skippedStages = getSkippedCandidateStages(currentStage, toStage);
  const skipsInterview = skippedStages.includes('INTERVIEWING');
  const requiresException = skippedStages.length > 0;
  const hasHrOverrideRole = (tokenService.getUserData()?.roles ?? [])
    .some((role) => role === 'HR_MANAGER' || role === 'ADMIN');
  const canUseException = allowException && hasHrOverrideRole;


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
    if (requiresException && !canUseException) {
      setErrorMessage('Chuyển bước này cần quyền ngoại lệ của HR cấp cao.');
      return;
    }
    if (requiresException && !isExceptionConfirmed) {
      setErrorMessage('Vui lòng xác nhận cảnh báo bỏ qua giai đoạn.');
      return;
    }
    if (requiresException && !exceptionReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do ngoại lệ để tiếp tục.');
      return;
    }

    const payload: MoveCandidateStagePayload = {
      applicationId,
      toStage,
      ...(requiresException
        ? { isException: true, exceptionReason: exceptionReason.trim() }
        : {}),
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
      if (currentStage === 'INTERVIEWING') {
        const evaluationStatus = await interviewEvaluationService.getEvaluationStatus(
          candidateId,
          applicationId,
        );
        if (!evaluationStatus.isComplete) {
          const pendingNames = evaluationStatus.pendingInterviewerNames?.filter(Boolean) ?? [];
          setErrorMessage(
            `Chưa thể chuyển giai đoạn: mới hoàn tất ${evaluationStatus.completedCount}/${evaluationStatus.requiredCount} đánh giá.${
              pendingNames.length > 0 ? ` Còn thiếu: ${pendingNames.join(', ')}.` : ''
            } Vui lòng hoàn tất đánh giá phỏng vấn trước.`,
          );
          return;
        }
        if (toStage === 'OFFER' || toStage === 'HIRED') {
          setPendingResultPayload(payload);
          setPendingResultStage(toStage);
          return;
        }
      }

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

          {requiresException && (
            <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-2.5 text-amber-950">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                <p className="text-sm leading-5">
                  Bạn đang chuyển thẳng ứng viên sang bước <strong>{CANDIDATE_STAGE_CONFIG[toStage].label}</strong>
                  {' '}bỏ qua {skipsInterview
                    ? <>vòng <strong>Phỏng vấn</strong></>
                    : <>giai đoạn {skippedStages.map((stage) => CANDIDATE_STAGE_CONFIG[stage].label).join(', ')}</>}.
                  {' '}Bạn có chắc chắn muốn tiếp tục?
                </p>
              </div>
              {!canUseException ? (
                <p role="alert" className="text-sm font-medium text-rose-700">
                  Chỉ HR Manager hoặc Admin có thể phê duyệt chuyển bước ngoại lệ.
                </p>
              ) : (
                <>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-amber-950">
                    <input
                      type="checkbox"
                      checked={isExceptionConfirmed}
                      onChange={(event) => setIsExceptionConfirmed(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-700 focus:ring-amber-500"
                    />
                    <span>Xác nhận thực hiện chuyển giai đoạn ngoại lệ</span>
                  </label>
                  <div>
                    <label htmlFor="move-stage-exception-reason" className="mb-1.5 block text-sm font-semibold text-amber-950">
                      Lý do ngoại lệ <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      id="move-stage-exception-reason"
                      rows={3}
                      maxLength={1000}
                      required
                      value={exceptionReason}
                      onChange={(event) => setExceptionReason(event.target.value)}
                      placeholder="Nêu rõ lý do cần bỏ qua giai đoạn theo quy trình..."
                      className="w-full resize-y rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </>
              )}
            </div>
          )}

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
      {pendingResultPayload && pendingResultStage && (
        <InterviewResultNotificationModal
          candidateId={candidateId}
          candidateName={candidateName}
          applicationId={applicationId}
          initialStage={pendingResultStage}
          onClose={() => {
            setPendingResultPayload(null);
            setPendingResultStage(null);
          }}
          onSuccess={(_result, stage) => {
            const completedPayload = { ...pendingResultPayload, toStage: stage };
            toast.success(
              `Đã chuyển ${candidateName} sang giai đoạn "${CANDIDATE_STAGE_CONFIG[stage].label}".`,
            );
            onSuccess(completedPayload);
            onClose();
          }}
        />
      )}
    </div>
  );
};

export default MoveStageModal;
