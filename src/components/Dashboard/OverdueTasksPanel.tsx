import { AlertCircle, ArrowUpRight, BriefcaseBusiness, Clock3, UsersRound } from 'lucide-react';
import { type FC } from 'react';
import { Link } from 'react-router-dom';
import type { DashboardActionItem } from '../../utils/dashboardAnalyticsHelper';

interface OverdueTasksPanelProps {
  items: DashboardActionItem[];
  isLoading: boolean;
}

const OverdueTasksPanel: FC<OverdueTasksPanelProps> = ({ items, isLoading }) => (
  <section
    aria-labelledby="overdue-tasks-title"
    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 id="overdue-tasks-title" className="font-bold text-slate-900">
          Ưu tiên cần xử lý
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Hồ sơ quá hạn SLA và tin tuyển dụng sắp/hết hạn
        </p>
      </div>
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>

    {isLoading ? (
      <div className="mt-5 space-y-3" aria-label="Đang tải danh sách ưu tiên">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-[68px] animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    ) : items.length === 0 ? (
      <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-slate-700">Không có việc quá hạn</p>
        <p className="mt-1 text-xs text-slate-500">Các hồ sơ và tin tuyển dụng đang trong hạn xử lý.</p>
      </div>
    ) : (
      <ul className="mt-5 space-y-3">
        {items.slice(0, 7).map((item) => {
          const Icon = item.kind === 'CANDIDATE' ? UsersRound : BriefcaseBusiness;
          const isOverdue = item.priority === 'OVERDUE';
          return (
            <li key={item.id}>
              <Link
                to={item.href}
                className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'
                }`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{item.detail}</span>
                </span>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-bold ${
                  isOverdue
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}>
                  {isOverdue ? (
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                  )}
                  {item.priorityLabel}
                </span>
                <ArrowUpRight className="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-indigo-600 sm:block" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

export default OverdueTasksPanel;
