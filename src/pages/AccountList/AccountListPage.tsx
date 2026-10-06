import React, { useState, useMemo } from 'react';
import type { AccountFilterParams, UserAccount } from '../../types/account';
import { MOCK_ACCOUNTS } from '../../data/mockAccounts';
import AccountFilterBar from '../../components/AccountList/AccountFilterBar';
import AccountTable from '../../components/AccountList/AccountTable';
import AccountPaginationBar from '../../components/AccountList/AccountPaginationBar';
import EditAccountModal from '../../components/AccountList/EditAccountModal';
import Sidebar from '../../components/Sidebar';

const DEFAULT_PAGE_SIZE = 20;

const INITIAL_FILTERS: AccountFilterParams = {
  searchKeyword: '',
  role: 'ALL',
  status: 'ALL',
};

export const AccountListPage: React.FC = () => {
  const [accountList, setAccountList] = useState<UserAccount[]>(MOCK_ACCOUNTS);
  const [filterParams, setFilterParams] = useState<AccountFilterParams>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Modal editing state
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Notification toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filter accounts based on search keyword and selected role/status
  const filteredAccounts = useMemo(() => {
    return accountList.filter((account) => {
      const keyword = filterParams.searchKeyword.trim().toLowerCase();

      // Search matches by full name, email or department
      const matchesSearch =
        keyword === '' ||
        account.fullName.toLowerCase().includes(keyword) ||
        account.email.toLowerCase().includes(keyword) ||
        account.department.toLowerCase().includes(keyword);

      // Filter matches by role
      const matchesRole =
        filterParams.role === 'ALL' || account.role === filterParams.role;

      // Filter matches by status
      const matchesStatus =
        filterParams.status === 'ALL' || account.status === filterParams.status;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accountList, filterParams]);

  // Paginate filtered results (Default 20 items per page)
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(startIndex, startIndex + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

  // Handler for filter changes, automatically resetting page to 1
  const handleFilterChange = (newFilters: Partial<AccountFilterParams>) => {
    setFilterParams((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Handler for resetting filters to default
  const handleResetFilters = () => {
    setFilterParams(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  // Handler for changing page size
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Handler for toggling status (Active <-> Locked)
  const handleToggleStatus = (account: UserAccount) => {
    const newStatus = account.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const actionText = newStatus === 'LOCKED' ? 'khóa' : 'mở khóa';

    setAccountList((prevList) =>
      prevList.map((item) =>
        item.id === account.id ? { ...item, status: newStatus } : item
      )
    );

    showNotification(
      `Đã ${actionText} thành công tài khoản: ${account.fullName} (${account.email})`
    );
  };

  // Handler for opening edit modal
  const handleOpenEditModal = (account: UserAccount) => {
    setEditingAccount(account);
    setIsEditModalOpen(true);
  };

  // Handler for saving edited account
  const handleSaveAccount = (updatedAccount: UserAccount) => {
    setAccountList((prevList) =>
      prevList.map((item) =>
        item.id === updatedAccount.id ? updatedAccount : item
      )
    );
    showNotification(`Đã cập nhật thông tin tài khoản: ${updatedAccount.fullName}`);
  };

  // Summary counts for dashboard badges
  const activeCount = useMemo(
    () => accountList.filter((account) => account.status === 'ACTIVE').length,
    [accountList]
  );
  const lockedCount = accountList.length - activeCount;

  return (
    <div className="flex min-h-screen bg-slate-100/75">
      {/* Shared Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                <span>Quản trị hệ thống</span>
                <span>/</span>
                <span className="text-slate-800">Quản lý tài khoản</span>
              </nav>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Danh sách tài khoản nội bộ
              </h1>
            </div>

            {/* Quick stats tags */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
                Tổng số: <strong className="text-indigo-600">{accountList.length}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs">
                Hoạt động: <strong>{activeCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-xs">
                Đã khóa: <strong>{lockedCount}</strong>
              </span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm transition-all animate-bounce-short">
              <span>✓</span>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Search & Filters Component */}
          <AccountFilterBar
            filterParams={filterParams}
            totalFilteredCount={filteredAccounts.length}
            totalCount={accountList.length}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />

          {/* Data Table Component */}
          <div className="space-y-0">
            <AccountTable
              accounts={paginatedAccounts}
              onEditAccount={handleOpenEditModal}
              onToggleStatus={handleToggleStatus}
              onResetFilters={handleResetFilters}
            />

            {/* Pagination Component */}
            {filteredAccounts.length > 0 && (
              <AccountPaginationBar
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredAccounts.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        </div>
      </main>

      {/* Edit Account Modal */}
      <EditAccountModal
        isOpen={isEditModalOpen}
        account={editingAccount}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveAccount}
      />
    </div>
  );
};

export default AccountListPage;
