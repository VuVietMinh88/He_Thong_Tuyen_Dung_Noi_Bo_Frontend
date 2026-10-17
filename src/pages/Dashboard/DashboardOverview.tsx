import { lazy, Suspense, useEffect, useState, type FC } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  RefreshCw,
  Send,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CandidateProfile } from '../../types/candidate';
import { slaService } from '../../services/slaService';
import OverdueTasksPanel from '../../components/Dashboard/OverdueTasksPanel';
import type { FunnelFilterState } from '../../types/recruitmentFunnel';
import {
  candidateService,
} from '../../services/candidateService';
import {
  jobPostingService,
} from '../../services/jobPostingService';
import {
  getDefaultFunnelFilters,
  recruitmentFunnelService,
} from '../../services/recruitmentFunnelService';
import {
  getDashboardOverviewMetrics,
  type DashboardOverviewMetrics,
} from '../../utils/dashboardOverviewHelper';
import {
  getDashboardActionItems,
  type DashboardActionItem,
} from '../../utils/dashboardAnalyticsHelper';
import { toast } from '../../components/notifications';

const RecruitmentTrendChart = lazy(
  () => import('../../components/Dashboard/RecruitmentTrendChart'),
);

interface OverviewData {
  metrics: DashboardOverviewMetrics;
  candidates: CandidateProfile[];
  actionItems: DashboardActionItem[];
  updatedAt: Date;
}

const metricCards = [
  {
    key: 'openPositions',
    title: 'Vị trí đang tuyển',
    caption: 'Tin tuyển dụng còn hiệu lực',
    icon: BriefcaseBusiness,
    iconClass: 'bg-indigo-50 text-indigo-700',
    accentClass: 'from-indigo-500/10',
    href: '/job-postings',
    testId: 'dashboard-metric-open-positions',
  },
  {
    key: 'receivedCVs',
    title: 'CV đã tiếp nhận',
    caption: 'Tổng hồ sơ ứng viên trong hệ thống',
    icon: FileText,
    iconClass: 'bg-sky-50 text-sky-700',
    accentClass: 'from-sky-500/10',
    href: '/candidates',
    testId: 'dashboard-metric-received-cvs',
  },
  {
    key: 'pendingApplications',
    title: 'Hồ sơ chờ xử lý',
    caption: 'Hồ sơ mới và đang sàng lọc',
    icon: UsersRound,
    iconClass: 'bg-amber-50 text-amber-700',
    accentClass: 'from-amber-500/10',
    href: '/candidates',
    testId: 'dashboard-metric-pending-applications',
  },
  {
    key: 'offersSentThisMonth',
    title: 'Offer đã gửi trong tháng',
    caption: 'Ứng viên ở giai đoạn đề nghị tuyển dụng',
    icon: Send,
    iconClass: 'bg-emerald-50 text-emerald-700',
    accentClass: 'from-emerald-500/10',
    href: '/offers/approval',
    testId: 'dashboard-metric-offers-sent',
  },
] as const;

const formatUpdatedAt = (date: Date): string =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

export const DashboardOverview: FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;
    const filters: FunnelFilterState = getDefaultFunnelFilters();

    Promise.all([
      jobPostingService.getManageableJobPostings(),
      candidateService.getCandidates(),
      recruitmentFunnelService.getFunnelReportData(filters),
      slaService.getSlaSettings(),
    ])
      .then(([postings, candidates, funnel, slaSettings]) => {
        if (!isCurrentRequest) return;
        const offeredStage = funnel.stages.find((stage) => stage.id === 'OFFERED');
        const referenceDate = new Date();
        setOverview({
          metrics: getDashboardOverviewMetrics(
            postings,
            candidates,
            offeredStage?.count ?? 0,
            referenceDate,
          ),
          candidates,
          actionItems: getDashboardActionItems(
            candidates,
            postings,
            slaSettings,
            referenceDate,
          ),
          updatedAt: referenceDate,
        });
        setError('');
      })
      .catch((requestError: unknown) => {
        if (!isCurrentRequest) return;
        const message = requestError instanceof Error
          ? requestError.message
          : 'Không thể tải dữ liệu tổng quan tuyển dụng.';
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [refreshCount]);

  const handleRefresh = () => {
    setIsLoading(true);
    setError('');
    setRefreshCount((count) => count + 1);
  };

  return (
    <div
      data-testid="dashboard-overview"
      className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">TỔNG QUAN TUYỂN DỤNG</p>
            <h1
              data-testid="dashboard-overview-title"
              className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
            >
              Bảng điều khiển
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Theo dõi nhanh vị trí tuyển dụng, hồ sơ ứng viên và tiến độ gửi thư mời.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {overview && !isLoading && (
              <span className="text-xs text-slate-500">
                Cập nhật lúc {formatUpdatedAt(overview.updatedAt)}
              </span>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-wait disabled:opacity-60"
              data-testid="dashboard-refresh-button"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Làm mới
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button type="button" onClick={handleRefresh} className="shrink-0 font-semibold underline">
              Thử tải lại
            </button>
          </div>
        )}

        <section aria-label="Chỉ số tuyển dụng" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            const value = overview?.metrics[card.key];
            return (
              <Link
                key={card.key}
                to={card.href}
                data-testid={card.testId}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:p-6"
              >
                <div className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${card.accentClass} to-transparent opacity-80 transition-transform duration-300 group-hover:scale-125`} />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">{card.title}</p>
                    {isLoading && value === undefined ? (
                      <div className="mt-3 h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
                    ) : (
                      <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                        {(value ?? 0).toLocaleString('vi-VN')}
                      </p>
                    )}
                    <p className="mt-2 text-xs leading-5 text-slate-500">{card.caption}</p>
                  </div>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconClass} transition-transform duration-200 group-hover:scale-105`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="relative mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500 transition group-hover:text-indigo-700">
                  <span>Xem chi tiết</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Suspense
            fallback={
              <div className="h-[360px] animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
            }
          >
            <RecruitmentTrendChart candidates={overview?.candidates ?? []} />
          </Suspense>
          <OverdueTasksPanel
            items={overview?.actionItems ?? []}
            isLoading={isLoading && !overview}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-700 p-6 text-white shadow-md sm:p-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-50">
                  Không gian làm việc HR
                </span>
                <h2 className="mt-4 text-xl font-bold sm:text-2xl">
                  Tuyển đúng người, đúng thời điểm
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">
                  Bắt đầu ngày mới bằng việc ưu tiên hồ sơ đang chờ xử lý và theo sát các vị trí còn mở.
                </p>
              </div>
              <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/10 sm:flex">
                <BriefcaseBusiness className="h-9 w-9 text-white" aria-hidden="true" />
              </div>
            </div>
            <Link
              to="/candidates"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              Xem hồ sơ ứng viên
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">Truy cập nhanh</h2>
            <p className="mt-1 text-sm text-slate-500">Đi thẳng đến các công việc thường dùng.</p>
            <div className="mt-5 space-y-3">
              <Link
                to="/candidates"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span className="flex items-center gap-3">
                  <UsersRound className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  Quản lý ứng viên
                </span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/reports/funnel"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <span className="flex items-center gap-3">
                  <ArrowDownRight className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Báo cáo phễu tuyển dụng
                </span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardOverview;
