import React, { useMemo, useState } from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BriefcaseBusiness, GripVertical } from 'lucide-react';
import type { CandidateProfile, CandidateStage } from '../../types/candidate';
import { CANDIDATE_STAGE_CONFIG } from '../../types/candidate';
import KanbanCard from './KanbanCard';

export interface CandidateStageChangePayload {
  candidateId: string;
  fromStage: CandidateStage;
  toStage: CandidateStage;
}

export interface CandidateKanbanBoardProps {
  candidates: CandidateProfile[];
  selectedJobId?: string;
  onSelectCandidate?: (candidate: CandidateProfile) => void;
  onStageChange: (payload: CandidateStageChangePayload) => void;
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

interface KanbanColumnProps {
  stage: CandidateStage;
  candidates: CandidateProfile[];
  onSelectCandidate?: (candidate: CandidateProfile) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  candidates,
  onSelectCandidate,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${stage}`,
    data: { stage },
  });
  const stageConfig = CANDIDATE_STAGE_CONFIG[stage];

  return (
    <section
      aria-labelledby={`kanban-heading-${stage}`}
      className={`flex max-h-[calc(100vh-18rem)] min-h-80 w-[min(84vw,19rem)] shrink-0 flex-col rounded-2xl border transition-colors duration-200 sm:w-80 ${
        isOver ? 'border-indigo-400 bg-indigo-100/80 ring-2 ring-indigo-300/70' : 'border-slate-200 bg-slate-100/70'
      }`}
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
          {candidates.length}
        </span>
      </header>

      <SortableContext
        items={candidates.map((candidate) => candidate.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          data-testid={`kanban-column-${stage}`}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain p-3 [scrollbar-width:thin]"
        >
          {candidates.length > 0 ? candidates.map((candidate) => (
            <SortableCandidateCard
              key={candidate.id}
              candidate={candidate}
              stage={stage}
              onSelectCandidate={onSelectCandidate}
            />
          )) : (
            <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 text-center">
              <BriefcaseBusiness className="h-5 w-5 text-slate-300" aria-hidden="true" />
              <p className="mt-2 text-xs text-slate-400">Chưa có ứng viên ở giai đoạn này</p>
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
};

interface SortableCandidateCardProps {
  candidate: CandidateProfile;
  stage: CandidateStage;
  onSelectCandidate?: (candidate: CandidateProfile) => void;
}

const SortableCandidateCard: React.FC<SortableCandidateCardProps> = ({
  candidate,
  stage,
  onSelectCandidate,
}) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: candidate.id,
    data: { stage },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative rounded-xl transition-shadow ${isDragging ? 'z-10 opacity-35' : ''}`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Kéo ${candidate.fullName} sang giai đoạn khác`}
        className="absolute right-2 top-2 z-10 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-500 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      <KanbanCard
        candidate={candidate}
        stage={stage}
        onClick={onSelectCandidate}
      />
    </div>
  );
};

export const CandidateKanbanBoard: React.FC<CandidateKanbanBoardProps> = ({
  candidates,
  selectedJobId,
  onSelectCandidate,
  onStageChange,
}) => {
  const [activeCandidate, setActiveCandidate] = useState<CandidateProfile | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveCandidate(candidates.find((candidate) => candidate.id === active.id) ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveCandidate(null);
    if (!over) return;

    const candidate = candidates.find((item) => item.id === active.id);
    if (!candidate) return;

    const fromStage = getCandidateKanbanStage(candidate.status);
    const targetCandidate = candidates.find((item) => item.id === over.id);
    const toStage = targetCandidate
      ? getCandidateKanbanStage(targetCandidate.status)
      : (over.data.current?.stage as CandidateStage | undefined);

    if (!toStage || fromStage === toStage) return;

    onStageChange({
      candidateId: candidate.id,
      fromStage,
      toStage,
    });
  };

  const handleDragCancel = () => setActiveCandidate(null);
  const activeStage = activeCandidate ? getCandidateKanbanStage(activeCandidate.status) : undefined;

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:thin]">
          {KANBAN_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              candidates={candidatesByStage.get(stage) ?? []}
              onSelectCandidate={onSelectCandidate}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCandidate && activeStage ? (
            <div className="rotate-1 cursor-grabbing rounded-xl shadow-xl">
              <KanbanCard candidate={activeCandidate} stage={activeStage} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
};

export default CandidateKanbanBoard;
