import React, { useState, useEffect } from 'react';
import type { AccountFilterParams, AccountRole, UserAccount } from '../../types/account';
import { userService } from '../../services/userService';
import { useDebounce } from '../../hooks/useDebounce';
import AccountFilterBar from '../../components/AccountList/AccountFilterBar';
import AccountTable from '../../components/AccountList/AccountTable';
import AccountPaginationBar from '../../components/AccountList/AccountPaginationBar';
import EditAccountModal from '../../components/AccountList/EditAccountModal';
import ManageRolesModal from '../../components/AccountList/ManageRolesModal';
import LockAccountModal from '../../components/AccountList/LockAccountModal';
import UnlockAccountModal from '../../components/AccountList/UnlockAccountModal';
import Sidebar from '../../components/Sidebar';

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_DELAY_MS = 350;

const INITIAL_FILTERS: AccountFilterParams = {
  searchKeyword: '',
  role: 'ALL',
  status: 'ALL',
};

export const AccountListPage: React.FC = () => {
  // Account list, counts and server pagination state
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalSystemUsers, setTotalSystemUsers] = useState<number>(0);

  // Filter and pagination controls
  const [filterParams, setFilterParams] = useState<AccountFilterParams>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Asynchronous states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modal editing state
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Modal managing roles state (User Story S1-09 / TKNHTTDNB1-152)
  const [managingRolesAccount, setManagingRolesAccount] = useState<UserAccount | null>(null);
  const [isManageRolesModalOpen, setIsManageRolesModalOpen] = useState<boolean>(false);

  // Modal locking & unlocking state (User Story S1-10 / TKNHTTDNB1-160)
  const [lockingAccount, setLockingAccount] = useState<UserAccount | null>(null);
  const [isLockModalOpen, setIsLockModalOpen] = useState<boolean>(false);
  const [unlockingAccount, setUnlockingAccount] = useState<UserAccount | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);

  // Notification toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounce search keyword to avoid flooding API requests while typing
  const debouncedSearchKeyword = useDebounce(
    filterParams.searchKeyword,
    SEARCH_DEBOUNCE_DELAY_MS
  );

  const showNotification = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch accounts from API whenever search, filter, or pagination changes
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setApiError(null);

      try {
        const response = await userService.getUsers({
          search: debouncedSearchKeyword,
          role: filterParams.role,
          status: filterParams.status,
          page: currentPage,
          limit: pageSize,
        });

        if (isMounted) {
          setAccounts(response.users);
          setTotalItems(response.totalItems);
          setTotalPages(response.totalPages);

          // Store total count on initial load when no filter is applied
          if (!debouncedSearchKeyword && filterParams.role === 'ALL' && filterParams.status === 'ALL') {
            setTotalSystemUsers(response.totalItems);
          }
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : 'Không thể kết nối đến máy chủ để lấy danh sách tài khoản.';
          setApiError(message);
          setAccounts([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearchKeyword, filterParams.role, filterParams.status, currentPage, pageSize]);

  // Handler for filter changes, resetting page to 1
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

  // Handler for requesting account lock with reason modal (User Story S1-10)
  const handleRequestLock = (account: UserAccount) => {
    setLockingAccount(account);
    setIsLockModalOpen(true);
  };

  // Handler for requesting account unlock modal (User Story S1-10)
  const handleRequestUnlock = (account: UserAccount) => {
    setUnlockingAccount(account);
    setIsUnlockModalOpen(true);
  };

  // Handler for confirming lock with reason via API (User Story S1-10 / TKNHTTDNB1-160)
  const handleConfirmLock = async (userId: string, reason: string) => {
    try {
      const result = await userService.lockUser(userId, reason);

      setAccounts((prevList) =>
        prevList.map((item) =>
          item.id === userId
            ? {
                ...item,
                status: 'LOCKED',
                lockReason: reason,
                lockedAt: result.lockedAt,
              }
            : item
        )
      );

      showNotification(`Đã khóa thành công tài khoản. Lý do: "${reason}"`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Lỗi khi thực hiện khóa tài khoản.';
      showNotification(message);
      throw error;
    }
  };

  // Handler for confirming unlock via API (User Story S1-10 / TKNHTTDNB1-160)
  const handleConfirmUnlock = async (userId: string) => {
    try {
      await userService.unlockUser(userId);

      setAccounts((prevList) =>
        prevList.map((item) =>
          item.id === userId
            ? {
                ...item,
                status: 'ACTIVE',
                lockReason: undefined,
                lockedAt: undefined,
              }
            : item
        )
      );

      showNotification('Đã mở khóa thành công tài khoản người dùng.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Lỗi khi mở khóa tài khoản.';
      showNotification(message);
      throw error;
    }
  };

  // Handler for toggling status (Active <-> Locked) via API (fallback)
  const handleToggleStatus = async (account: UserAccount) => {
    if (account.status === 'ACTIVE') {
      handleRequestLock(account);
    } else {
      handleRequestUnlock(account);
    }
  };

  // Handler for opening edit modal
  const handleOpenEditModal = (account: UserAccount) => {
    setEditingAccount(account);
    setIsEditModalOpen(true);
  };

  // Handler for opening manage roles modal (User Story S1-09)
  const handleOpenManageRoles = (account: UserAccount) => {
    setManagingRolesAccount(account);
    setIsManageRolesModalOpen(true);
  };

  // Handler for updating user roles via API (User Story S1-09)
  const handleSaveRoles = async (userId: string, newRoles: AccountRole[]) => {
    try {
      await userService.updateUserRoles(userId, newRoles);

      setAccounts((prevList) =>
        prevList.map((item) =>
          item.id === userId
            ? { ...item, roles: newRoles, role: newRoles[0] }
            : item
        )
      );

      showNotification('Cập nhật phân quyền vai trò người dùng thành công.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Lỗi khi cập nhật vai trò người dùng.';
      showNotification(message);
      throw error;
    }
  };

  // Handler for saving edited account via API
  const handleSaveAccount = async (updatedAccount: UserAccount) => {
    try {
      const savedAccount = await userService.updateUser(updatedAccount);

      setAccounts((prevList) =>
        prevList.map((item) =>
          item.id === savedAccount.id ? savedAccount : item
        )
      );

      showNotification(`Đã cập nhật thông tin tài khoản: ${savedAccount.fullName}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Lỗi khi cập nhật tài khoản.';
      showNotification(message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100/75">
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
                Tổng cộng: <strong className="text-indigo-600">{totalSystemUsers || totalItems}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs">
                Kết quả: <strong>{totalItems}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
                Trang: <strong>{currentPage}/{totalPages}</strong>
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

          {/* API Error Notification */}
          {apiError && (
            <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{apiError}</span>
              </div>
            </div>
          )}

          {/* Search & Filters Component */}
          <AccountFilterBar
            filterParams={filterParams}
            totalFilteredCount={totalItems}
            totalCount={totalSystemUsers || totalItems}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />

          {/* Data Table Component with Loading Skeleton */}
          <div className="space-y-0">
            <AccountTable
              accounts={accounts}
              isLoading={isLoading}
              onEditAccount={handleOpenEditModal}
              onManageRoles={handleOpenManageRoles}
              onRequestLock={handleRequestLock}
              onRequestUnlock={handleRequestUnlock}
              onToggleStatus={handleToggleStatus}
              onResetFilters={handleResetFilters}
            />

            {/* Pagination Component */}
            {!isLoading && totalItems > 0 && (
              <AccountPaginationBar
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
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

      {/* Manage Roles Modal (User Story S1-09 / TKNHTTDNB1-152) */}
      <ManageRolesModal
        isOpen={isManageRolesModalOpen}
        account={managingRolesAccount}
        onClose={() => setIsManageRolesModalOpen(false)}
        onSaveRoles={handleSaveRoles}
      />

      {/* Lock Account Modal with Reason & Headcount Warning (User Story S1-10 / TKNHTTDNB1-160) */}
      <LockAccountModal
        isOpen={isLockModalOpen}
        account={lockingAccount}
        onClose={() => setIsLockModalOpen(false)}
        onConfirmLock={handleConfirmLock}
      />

      {/* Unlock Account Modal (User Story S1-10 / TKNHTTDNB1-160) */}
      <UnlockAccountModal
        isOpen={isUnlockModalOpen}
        account={unlockingAccount}
        onClose={() => setIsUnlockModalOpen(false)}
        onConfirmUnlock={handleConfirmUnlock}
      />
    </div>
  );
};

export default AccountListPage;
