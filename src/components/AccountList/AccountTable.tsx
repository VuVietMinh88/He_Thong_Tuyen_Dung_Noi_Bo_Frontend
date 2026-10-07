import type { AccountRole, UserAccount } from '../../types/account';
import { tokenService } from '../../services/token.service';
import { ToggleStatusButton } from './ToggleStatusButton';

interface AccountTableProps {
  accounts: UserAccount[];
  isLoading?: boolean;
  onEditAccount: (account: UserAccount) => void;
  onManageRoles?: (account: UserAccount) => void;
  onRequestLock?: (account: UserAccount) => void;
  onRequestUnlock?: (account: UserAccount) => void;
  onToggleStatus?: (account: UserAccount) => void;
  onResetFilters?: () => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  isLoading = false,
  onEditAccount,
  onManageRoles,
  onRequestLock,
  onRequestUnlock,
  onToggleStatus,
  onResetFilters,
}) => {
  const currentUser = tokenService.getUserData();
  // Render badge for role with distinctive semantic styling
  const renderRoleBadge = (role: AccountRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
            Admin
          </span>
        );
      case 'RECRUITER':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Recruiter
          </span>
        );
      case 'HIRING_MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Hiring Manager
          </span>
        );
      case 'INTERVIEWER':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Interviewer
          </span>
        );
      case 'CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-400/20">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            Ứng viên
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
            {role}
          </span>
        );
    }
  };

  // Render status badge (Active / Locked - User Story S1-10)
  const renderStatusBadge = (account: UserAccount) => {
    if (account.status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Hoạt động
        </span>
      );
    }

    return (
      <div className="flex flex-col items-start gap-1">
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20"
          title={account.lockReason ? `Lý do khóa: ${account.lockReason}` : 'Tài khoản đã bị khóa'}
        >
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span>Đã khóa</span>
          <span className="text-[11px]">🔒</span>
        </span>
        {account.lockReason && (
          <span
            className="max-w-[150px] truncate text-[11px] text-slate-500 italic"
            title={account.lockReason}
          >
            "{account.lockReason}"
          </span>
        )}
      </div>
    );
  };

  // Generate abbreviation from full name for avatar placeholder
  const getAvatarInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'TK').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Họ tên</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phòng ban</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white animate-pulse">
              {[1, 2, 3, 4, 5].map((skeletonIndex) => (
                <tr key={`skeleton-${skeletonIndex}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 rounded bg-slate-200" />
                        <div className="h-2.5 w-16 rounded bg-slate-100" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-3.5 w-40 rounded bg-slate-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-28 rounded-lg bg-slate-100" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-20 rounded-full bg-slate-100" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-24 rounded-full bg-slate-100" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <div className="h-7 w-12 rounded-lg bg-slate-100" />
                      <div className="h-7 w-14 rounded-lg bg-slate-100" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl text-slate-400">
          🔍
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">
          Không tìm thấy tài khoản phù hợp
        </h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md">
          Không có kết quả nào khớp với từ khóa tìm kiếm hoặc bộ lọc được chọn. Vui lòng thử tìm kiếm lại hoặc đặt lại bộ lọc.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-4">
                Họ tên
              </th>
              <th scope="col" className="px-6 py-4">
                Email
              </th>
              <th scope="col" className="px-6 py-4">
                Phòng ban
              </th>
              <th scope="col" className="px-6 py-4">
                Vai trò
              </th>
              <th scope="col" className="px-6 py-4">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-4 text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {accounts.map((account) => {
              const isLocked = account.status === 'LOCKED';
              const isSelf = Boolean(
                currentUser &&
                  (currentUser.id === account.id ||
                    (currentUser.email &&
                      currentUser.email.toLowerCase() === account.email.toLowerCase()))
              );
              const activeJobsCount = account.activeJobsCount ?? (account.assignedJobs?.length || 0);

              return (
                <tr
                  key={account.id}
                  className={[
                    "transition hover:bg-slate-50/80",
                    isLocked ? "bg-slate-50/40" : "",
                  ].join(" ")}
                >
                  {/* Họ tên column with Avatar and Headcount warning tag */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm",
                        isLocked
                          ? "bg-slate-400"
                          : "bg-gradient-to-br from-indigo-500 to-blue-600",
                      ].join(" ")}>
                        {getAvatarInitials(account.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {account.fullName}
                          </span>
                          {isSelf && (
                            <span className="rounded-md bg-indigo-50 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                              Tôi
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 font-mono">
                            {account.id}
                          </span>
                          {activeJobsCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 shadow-2xs"
                              title={`Đang phụ trách ${activeJobsCount} vị trí tuyển dụng: ${(account.assignedJobs || []).join(', ')}`}
                            >
                              🎯 {activeJobsCount} vị trí
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email column */}
                  <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                    <a
                      href={`mailto:${account.email}`}
                      className="font-medium text-slate-700 hover:text-indigo-600 hover:underline"
                    >
                      {account.email}
                    </a>
                  </td>

                  {/* Phòng ban column */}
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      🏢 {account.department}
                    </span>
                  </td>

                  {/* Vai trò column (hỗ trợ hiển thị nhiều vai trò) */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                      {(account.roles && account.roles.length > 0
                        ? account.roles
                        : [account.role]
                      ).map((roleItem) => (
                        <span key={roleItem}>{renderRoleBadge(roleItem)}</span>
                      ))}
                    </div>
                  </td>

                  {/* Trạng thái column (User Story S1-10) */}
                  <td className="whitespace-nowrap px-6 py-4">
                    {renderStatusBadge(account)}
                  </td>

                  {/* Thao tác column: Phân quyền, Sửa, Khóa / Mở khóa */}
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Phân quyền vai trò button (User Story S1-09 / TKNHTTDNB1-152) */}
                      {onManageRoles && (
                        <button
                          type="button"
                          onClick={() => onManageRoles(account)}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 hover:border-indigo-300 shadow-xs"
                          title="Gán và quản lý vai trò người dùng"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Phân quyền</span>
                        </button>
                      )}

                      {/* Sửa button */}
                      <button
                        type="button"
                        onClick={() => onEditAccount(account)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-indigo-600 shadow-sm"
                        title="Chỉnh sửa thông tin tài khoản"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Sửa</span>
                      </button>

                      {/* Nút Khóa / Mở khóa tài khoản (Story 19 / TKNHTTDNB1-161) */}
                      <ToggleStatusButton
                        account={account}
                        isSelf={isSelf}
                        onRequestLock={(target) =>
                          onRequestLock ? onRequestLock(target) : onToggleStatus?.(target)
                        }
                        onRequestUnlock={(target) =>
                          onRequestUnlock ? onRequestUnlock(target) : onToggleStatus?.(target)
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountTable;
