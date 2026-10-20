import { useEffect, useState, type FC } from 'react';
import {
  AlertCircle,
  BriefcaseBusiness,
  Loader2,
  RefreshCw,
  Sparkles,
  UserRoundPlus,
} from 'lucide-react';
import type { OfferRecord } from '../../types/offer';
import type { TalentPoolCandidateSuggestion } from '../../types/talentPool';
import { talentPoolService } from '../../services/talentPoolService';
import { AssignCandidateToJobModal } from '../Candidate/AssignCandidateToJobModal';
import { toast } from '../notifications';
import { CounterOfferModal } from './CounterOfferModal';

export interface OfferRecoveryPanelProps {
  offer: OfferRecord;
  jobId?: string;
}

export const OfferRecoveryPanel: FC<OfferRecoveryPanelProps> = ({ offer, jobId }) => {
  const [suggestions, setSuggestions] = useState<TalentPoolCandidateSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCandidate, setSelectedCandidate] =
    useState<TalentPoolCandidateSuggestion | null>(null);
  const [isCounterOfferOpen, setIsCounterOfferOpen] = useState(false);
  const [suggestionRequest, setSuggestionRequest] = useState(0);

  useEffect(() => {
    if (!jobId) return;
    let isCurrent = true;
    talentPoolService
      .getTalentPoolSuggestions(jobId, { sortBy: 'MATCH_SCORE_DESC' })
      .then((results) => {
        if (isCurrent) {
          setSuggestions(
            results
              .filter((candidate) => candidate.candidateId !== offer.candidateId)
              .slice(0, 5),
          );
          setLoadError('');
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Không thể tải gợi ý ứng viên từ Talent Pool.',
          );
          setSuggestions([]);
          toast.error(
            error instanceof Error
              ? error.message
              : 'Không thể tải gợi ý ứng viên từ Talent Pool.',
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [jobId, offer.candidateId, suggestionRequest]);

  const suggestionsError = jobId
    ? loadError
    : 'Offer chưa có mã vị trí tuyển dụng để tìm ứng viên phù hợp.';
  const isSuggestionsLoading = Boolean(jobId) && isLoading;

  const handleCounterOfferSuccess = (replacement: OfferRecord) => {
    toast.success(`Đã tạo offer thay thế ${replacement.offerCode} cho ${offer.candidateName}.`);
    setIsCounterOfferOpen(false);
  };

  const handleCandidateAssigned = (candidate: TalentPoolCandidateSuggestion) => {
    setSuggestions((current) =>
      current.filter((item) => item.candidateId !== candidate.candidateId),
    );
  };

  return (
    <section
      data-testid="offer-recovery-panel"
      className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"
    >
      <header className="flex flex-col gap-4 border-b border-amber-100 bg-amber-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Offer bị từ chối · Phương án tiếp theo</h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Tạo đề nghị điều chỉnh cho {offer.candidateName} hoặc xem ứng viên dự phòng phù hợp trong Talent Pool.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsCounterOfferOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          data-testid="create-counter-offer-button"
        >
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          Tạo offer thay thế
        </button>
      </header>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ứng viên dự phòng gợi ý</h3>
            <p className="mt-1 text-xs text-slate-500">
              Danh sách được sắp xếp theo mức độ phù hợp với vị trí {offer.jobTitle}.
            </p>
          </div>
          {!isSuggestionsLoading && !suggestionsError && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {suggestions.length} gợi ý
            </span>
          )}
        </div>

        {isSuggestionsLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" aria-hidden="true" />
            Đang tìm ứng viên phù hợp trong Talent Pool...
          </div>
        ) : suggestionsError ? (
          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center">
            <p className="flex items-start gap-2 text-sm text-rose-800" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {suggestionsError}
            </p>
            {jobId && (
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setLoadError('');
                  setSuggestionRequest((current) => current + 1);
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Thử lại
              </button>
            )}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-7 text-center">
            <p className="text-sm font-semibold text-slate-700">Chưa tìm thấy ứng viên phù hợp</p>
            <p className="mt-1 text-xs text-slate-500">
              Có thể thử lại sau hoặc mở rộng tiêu chí tìm kiếm trong Talent Pool.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {suggestions.map((candidate) => (
              <li
                key={candidate.candidateId}
                className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                data-testid={`offer-talent-suggestion-${candidate.candidateId}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900">{candidate.fullName}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      {candidate.matchScore}% phù hợp
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {candidate.currentTitle || candidate.category}
                    {candidate.experienceYears > 0 && ` · ${candidate.experienceYears} năm kinh nghiệm`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {candidate.matchedSkills.slice(0, 4).map((skill) => (
                      <span key={skill} className="rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(candidate)}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
                  Mời vào quy trình
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isCounterOfferOpen && (
        <CounterOfferModal
          key={offer.offerId}
          offer={offer}
          onClose={() => setIsCounterOfferOpen(false)}
          onSuccess={handleCounterOfferSuccess}
        />
      )}
      {selectedCandidate && (
        <AssignCandidateToJobModal
          isOpen
          onClose={() => setSelectedCandidate(null)}
          candidate={selectedCandidate}
          selectedJobId={jobId}
          selectedJobTitle={offer.jobTitle}
          onSuccess={handleCandidateAssigned}
        />
      )}
    </section>
  );
};

export default OfferRecoveryPanel;
