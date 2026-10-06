import type { AccountRole, AccountStatus, UserAccount } from '../../types/account';

interface AccountTableProps {
  accounts: UserAccount[];
  onEditAccount: (account: UserAccount) => void;
  onToggleStatus: (account: UserAccount) => void;
  onResetFilters?: () => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  onEditAccount,
  onToggleStatus,
  onResetFilters,
}) => {
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Interviewer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
            {role}
          </span>
        );
    }
  };

  // Render status badge (Active / Locked)
  const renderStatusBadge = (status: AccountStatus) => {
    if (status === 'ACTIVE') {
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
        <span className="h-2 w-2 rounded-full bg-rose-500" />
        Đã khóa
      </span>
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

              return (
                <tr
                  key={account.id}
                  className={[
                    "transition hover:bg-slate-50/80",
                    isLocked ? "bg-slate-50/30" : "",
                  ].join(" ")}
                >
                  {/* Họ tên column with Avatar */}
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
                        <div className="font-semibold text-slate-900 truncate">
                          {account.fullName}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {account.id}
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

                  {/* Vai trò column */}
                  <td className="whitespace-nowrap px-6 py-4">
                    {renderRoleBadge(account.role)}
                  </td>

                  {/* Trạng thái column */}
                  <td className="whitespace-nowrap px-6 py-4">
                    {renderStatusBadge(account.status)}
                  </td>

                  {/* Thao tác column: Sửa, Khóa / Mở khóa */}
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
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

                      {/* Khóa / Mở khóa button */}
                      <button
                        type="button"
                        onClick={() => onToggleStatus(account)}
                        className={[
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition shadow-sm",
                          isLocked
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
                        ].join(" ")}
                        title={isLocked ? "Mở khóa tài khoản này" : "Khóa tài khoản này"}
                      >
                        {isLocked ? (
                          <>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            <span>Mở khóa</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Khóa</span>
                          </>
                        )}
                      </button>
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
