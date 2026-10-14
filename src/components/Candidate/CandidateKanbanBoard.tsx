import React, { useMemo } from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import type { CandidateProfile, CandidateStage } from '../../types/candidate';
import { CANDIDATE_STAGE_CONFIG } from '../../types/candidate';
import KanbanCard from './KanbanCard';

export interface CandidateKanbanBoardProps {
  candidates: CandidateProfile[];
  selectedJobId?: string;
  onSelectCandidate?: (candidate: CandidateProfile) => void;
}

const KANBAN_STAGES: CandidateStage[] = [
  'NEW',
  'SCREENING',
  'INTERVIEWING',
  'OFFER',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
];

const stageAliases: Record<CandidateStage, string[]> = {
  NEW: ['NEW', 'APPLIED', 'RECEIVED', 'MỚI TIẾP NHẬN', 'HỒ SƠ MỚI', 'ĐÃ NHẬN HỒ SƠ'],
  SCREENING: ['SCREENING', 'IN_REVIEW', 'REVIEWING', 'ĐANG ĐÁNH GIÁ', 'SÀNG LỌC', 'ĐANG DUYỆT'],
  INTERVIEWING: ['INTERVIEWING', 'INTERVIEW', 'PHỎNG VẤN'],
  OFFER: ['OFFER', 'OFFERED', 'ĐỀ XUẤT OFFER', 'ĐÃ GỬI OFFER'],
  HIRED: ['HIRED', 'ACCEPTED', 'TRÚNG TUYỂN', 'NHẬN VIỆC', 'ĐÃ TUYỂN'],
  REJECTED: ['REJECTED', 'DECLINED', 'TỪ CHỐI', 'LOẠI HỒ SƠ', 'CHƯA PHÙ HỢP'],
  WITHDRAWN: ['WITHDRAWN', 'WITHDRAW', 'ĐÃ RÚT HỒ SƠ', 'ỨNG VIÊN RÚT LUI'],
};

const getCandidateKanbanStage = (status?: string): CandidateStage => {
  const normalizedStatus = (status ?? '').trim().replace(/[-\s]+/g, '_').toUpperCase();
  const matchingStage = KANBAN_STAGES.find((stage) => stageAliases[stage].some(
    (alias) => alias.replace(/[-\s]+/g, '_').toUpperCase() === normalizedStatus,
  ));
  return matchingStage ?? 'NEW';
};

export const CandidateKanbanBoard: React.FC<CandidateKanbanBoardProps> = ({
  candidates,
  selectedJobId,
  onSelectCandidate,
}) => {
  const filteredCandidates = useMemo(
    () => selectedJobId
      ? candidates.filter((candidate) => candidate.appliedJobId === selectedJobId)
      : candidates,
    [candidates, selectedJobId],
  );

  const candidatesByStage = useMemo(() => {
    const groups = new Map<CandidateStage, CandidateProfile[]>(
      KANBAN_STAGES.map((stage) => [stage, []]),
    );
    filteredCandidates.forEach((candidate) => {
      const stage = getCandidateKanbanStage(candidate.status);
      groups.get(stage)?.push(candidate);
    });
    return groups;
  }, [filteredCandidates]);

  return (
    <section aria-label="Bảng Kanban ứng viên theo giai đoạn">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {selectedJobId
            ? 'Ứng viên được nhóm theo giai đoạn của vị trí đã chọn.'
            : 'Ứng viên được nhóm theo giai đoạn tuyển dụng.'}
        </p>
        <span className="shrink-0 text-xs font-semibold text-slate-500">
          {filteredCandidates.length} ứng viên
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:thin]">
        {KANBAN_STAGES.map((stage) => {
          const stageCandidates = candidatesByStage.get(stage) ?? [];
          const stageConfig = CANDIDATE_STAGE_CONFIG[stage];

          return (
            <section
              key={stage}
              data-testid={`kanban-column-${stage}`}
              aria-labelledby={`kanban-heading-${stage}`}
              className="flex max-h-[calc(100vh-18rem)] min-h-80 w-[min(84vw,19rem)] shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-100/70 sm:w-80"
            >
              <header className="sticky top-0 flex items-center justify-between gap-3 rounded-t-2xl border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    stage === 'NEW' ? 'bg-blue-500'
                      : stage === 'SCREENING' ? 'bg-amber-500'
                        : stage === 'INTERVIEWING' ? 'bg-purple-500'
                          : stage === 'OFFER' ? 'bg-indigo-500'
                            : stage === 'HIRED' ? 'bg-emerald-500'
                              : stage === 'REJECTED' ? 'bg-rose-500'
                                : 'bg-slate-500'
                  }`} aria-hidden="true" />
                  <h2 id={`kanban-heading-${stage}`} className="truncate text-sm font-bold text-slate-800">
                    {stageConfig.label}
                  </h2>
                </div>
                <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  {stageCandidates.length}
                </span>
              </header>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain p-3 [scrollbar-width:thin]">
                {stageCandidates.length > 0 ? stageCandidates.map((candidate) => (
                  <KanbanCard
                    key={candidate.id}
                    candidate={candidate}
                    stage={stage}
                    onClick={onSelectCandidate}
                  />
                )) : (
                  <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 text-center">
                    <BriefcaseBusiness className="h-5 w-5 text-slate-300" aria-hidden="true" />
                    <p className="mt-2 text-xs text-slate-400">Chưa có ứng viên ở giai đoạn này</p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
};

export default CandidateKanbanBoard;
