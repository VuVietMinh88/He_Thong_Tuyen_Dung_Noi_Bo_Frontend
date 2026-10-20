import { useEffect, useMemo, useState, type FC, type ReactNode } from 'react';
import {
  BriefcaseBusiness,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  UsersRound,
} from 'lucide-react';
import { positionService } from '../../services/positionService';
import { tokenService } from '../../services/token.service';
import { toast } from '../../components/notifications';
import {
  filterDepartmentPositionProgress,
  type DepartmentPositionProgressRow,
  type DepartmentPositionStatus,
  type DepartmentPositionStatusFilter,
} from '../../utils/departmentPositionProgressHelper';

const statusLabels: Record<DepartmentPositionStatus, string> = {
  OPEN: 'Đang tuyển',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
};

const statusClasses: Record<DepartmentPositionStatus, string> = {
  OPEN: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PAUSED: 'border-amber-200 bg-amber-50 text-amber-800',
  COMPLETED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

const DepartmentPositionProgress: FC = () => {
  const [rows, setRows] = useState<DepartmentPositionProgressRow[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<DepartmentPositionStatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState(
    () => Boolean(tokenService.getUserData()?.departmentId),
  );
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const departmentUser = tokenService.getUserData();
  const departmentId = departmentUser?.departmentId ?? '';
  const departmentName = departmentUser?.departmentName ?? '';
  const missingDepartment = !departmentId;

  useEffect(() => {
    let isCurrent = true;
    if (!departmentId) return;

    positionService.getPositionsByDepartment()
      .then((positions) => {
        if (!isCurrent) return;
        setRows(positions);
        setError('');
      })
      .catch((requestError: unknown) => {
        if (!isCurrent) return;
        const message = requestError instanceof Error
          ? requestError.message
          : 'Không thể tải tiến độ tuyển dụng của phòng ban.';
        setError(message);
        setRows([]);
        toast.error(message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [departmentId, refreshCount]);

  const visibleRows = useMemo(
    () => filterDepartmentPositionProgress(rows, keyword, statusFilter),
    [rows, keyword, statusFilter],
  );
  const activeCount = rows.filter((row) => row.status === 'OPEN').length;
  const totalHired = rows.reduce((sum, row) => sum + row.hired, 0);
  const totalTarget = rows.reduce((sum, row) => sum + row.headcount, 0);

  const handleRefresh = () => {
    if (!departmentId) return;
    setError('');
    setIsLoading(true);
    setRefreshCount((count) => count + 1);
  };

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
              Theo dõi phòng ban
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Tiến độ tuyển dụng vị trí
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {departmentName
                ? `Tổng quan các vị trí thuộc ${departmentName}.`
                : 'Tổng quan các vị trí thuộc phòng ban của bạn.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Làm mới
          </button>
        </header>

        {(missingDepartment || error) && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {missingDepartment
              ? 'Tài khoản chưa được gán phòng ban. Vui lòng liên hệ quản trị viên để cập nhật phạm vi quản lý.'
              : error}
          </div>
        )}

        <section aria-label="Tổng quan định biên tuyển dụng" className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Vị trí đang tuyển"
            value={activeCount}
            icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
            iconClass="bg-indigo-50 text-indigo-700"
            loading={isLoading}
          />
          <SummaryCard
            label="Ứng viên đã tuyển"
            value={`${totalHired} / ${totalTarget}`}
            icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
            iconClass="bg-sky-50 text-sky-700"
            loading={isLoading}
          />
          <SummaryCard
            label="Vị trí hoàn thành"
            value={rows.filter((row) => row.status === 'COMPLETED').length}
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            iconClass="bg-emerald-50 text-emerald-700"
            loading={isLoading}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="font-bold text-slate-900">Danh sách vị trí tuyển dụng</h2>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi CV, hồ sơ qua vòng duyệt và mục tiêu tuyển dụng.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <span className="sr-only">Tìm kiếm vị trí</span>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm tên vị trí..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-56"
                />
              </label>
              <label className="relative block">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <span className="sr-only">Lọc theo trạng thái</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as DepartmentPositionStatusFilter)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-48"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="OPEN">Đang tuyển</option>
                  <option value="PAUSED">Tạm dừng</option>
                  <option value="COMPLETED">Hoàn thành</option>
                </select>
              </label>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5" role="status" aria-label="Đang tải vị trí tuyển dụng">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {rows.length === 0 ? 'Chưa có vị trí tuyển dụng trong phòng ban' : 'Không tìm thấy vị trí phù hợp'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Thử thay đổi từ khóa hoặc bộ lọc trạng thái.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Tên vị trí</th>
                      <th className="px-4 py-3.5 text-center font-semibold">Cần tuyển</th>
                      <th className="px-4 py-3.5 text-center font-semibold">CV đã nhận</th>
                      <th className="px-4 py-3.5 text-center font-semibold">CV đã duyệt</th>
                      <th className="px-4 py-3.5 font-semibold">Tiến độ</th>
                      <th className="px-6 py-3.5 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleRows.map((row) => <PositionTableRow key={row.id} row={row} />)}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-slate-100 md:hidden">
                {visibleRows.map((row) => <PositionMobileCard key={row.id} row={row} />)}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

interface SummaryCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  iconClass: string;
  loading: boolean;
}

const SummaryCard: FC<SummaryCardProps> = ({ label, value, icon, iconClass, loading }) => (
  <article className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded-md bg-slate-100" />
      ) : (
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
        </p>
      )}
    </div>
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>{icon}</span>
  </article>
);

const ProgressBar: FC<{ row: DepartmentPositionProgressRow }> = ({ row }) => (
  <div className="min-w-36">
    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
      <span className="font-semibold text-slate-700">{row.hired} / {row.headcount} đã tuyển</span>
      <span className="font-bold text-indigo-700">{row.progressPercent}%</span>
    </div>
    <div
      className="h-2 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-label={`Hoàn thành ${row.title}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={row.progressPercent}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-700"
        style={{ width: `${row.progressPercent}%` }}
      />
    </div>
  </div>
);

const PositionTableRow: FC<{ row: DepartmentPositionProgressRow }> = ({ row }) => (
  <tr className="transition hover:bg-slate-50/80">
    <td className="px-6 py-4">
      <span className="block font-semibold text-slate-800">{row.title}</span>
      <span className="mt-0.5 block text-xs text-slate-500">Mã yêu cầu: {row.id}</span>
    </td>
    <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">{row.headcount}</td>
    <td className="px-4 py-4 text-center text-sm text-slate-700">{row.receivedCvs}</td>
    <td className="px-4 py-4 text-center text-sm text-slate-700">{row.approvedCvs}</td>
    <td className="px-4 py-4"><ProgressBar row={row} /></td>
    <td className="px-6 py-4">
      <StatusBadge status={row.status} />
    </td>
  </tr>
);

const PositionMobileCard: FC<{ row: DepartmentPositionProgressRow }> = ({ row }) => (
  <li className="space-y-4 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-slate-800">{row.title}</h3>
        <p className="mt-1 text-xs text-slate-500">Mã yêu cầu: {row.id}</p>
      </div>
      <StatusBadge status={row.status} />
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <SmallMetric label="Cần tuyển" value={row.headcount} />
      <SmallMetric label="CV nhận" value={row.receivedCvs} />
      <SmallMetric label="CV duyệt" value={row.approvedCvs} />
    </div>
    <ProgressBar row={row} />
  </li>
);

const SmallMetric: FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 px-2 py-2">
    <p className="text-base font-bold text-slate-800">{value}</p>
    <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
  </div>
);

const StatusBadge: FC<{ status: DepartmentPositionStatus }> = ({ status }) => (
  <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>
    {statusLabels[status]}
  </span>
);

export default DepartmentPositionProgress;
