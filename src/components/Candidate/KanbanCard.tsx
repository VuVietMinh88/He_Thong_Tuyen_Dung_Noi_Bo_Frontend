import React from 'react';
import { BriefcaseBusiness, Mail, Phone, Star, UserRound } from 'lucide-react';
import type { CandidateProfile, CandidateStage } from '../../types/candidate';
import { CANDIDATE_STAGE_CONFIG } from '../../types/candidate';

export interface KanbanCardProps {
  candidate: CandidateProfile;
  stage: CandidateStage;
  onClick?: (candidate: CandidateProfile) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  candidate,
  stage,
  onClick,
}) => {
  const stageConfig = CANDIDATE_STAGE_CONFIG[stage];
  const initials = candidate.fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <article
      data-testid={`kanban-card-${candidate.id}`}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onClick?.(candidate)}
          className="flex min-w-0 items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={`Xem hồ sơ ${candidate.fullName}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
            {initials || <UserRound className="h-5 w-5" aria-hidden="true" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-900">{candidate.fullName}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">
              {candidate.appliedJobTitle || 'Chưa xác định vị trí'}
            </span>
          </span>
        </button>
        {typeof candidate.rating === 'number' && candidate.rating > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-1 text-xs font-bold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
            {candidate.rating}/5
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
        {candidate.email && (
          <a
            href={`mailto:${candidate.email}`}
            onClick={(event) => event.stopPropagation()}
            className="flex min-w-0 items-center gap-2 hover:text-indigo-700"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{candidate.email}</span>
          </a>
        )}
        {candidate.phone && (
          <a
            href={`tel:${candidate.phone}`}
            onClick={(event) => event.stopPropagation()}
            className="flex items-center gap-2 hover:text-indigo-700"
          >
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span>{candidate.phone}</span>
          </a>
        )}
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>
            {typeof candidate.experienceYears === 'number'
              ? `${candidate.experienceYears} năm kinh nghiệm`
              : candidate.currentTitle || 'Kinh nghiệm chưa cập nhật'}
          </span>
        </div>
      </div>

      {candidate.tags && candidate.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {candidate.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                tag.colorClass || 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {tag.name}
            </span>
          ))}
          {candidate.tags.length > 3 && (
            <span className="self-center text-[10px] text-slate-400">
              +{candidate.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stageConfig.badgeClass}`}>
          {stageConfig.label}
        </span>
        {candidate.appliedAt && (
          <time
            dateTime={candidate.appliedAt}
            className="text-[10px] text-slate-400"
          >
            {new Date(candidate.appliedAt).toLocaleDateString('vi-VN')}
          </time>
        )}
      </div>
    </article>
  );
};

export default KanbanCard;
