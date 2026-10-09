import React, { useState, useEffect, useRef } from "react";
import { useToast } from "../../components/notifications/useToast";
import type {
  AccountFilterParams,
  AccountRole,
  UserAccount,
} from "../../types/account";
import { userService } from "../../services/userService";
import { useDebounce } from "../../hooks/useDebounce";
import AccountFilterBar from "../../components/AccountList/AccountFilterBar";
import AccountTable from "../../components/AccountList/AccountTable";
import AccountPaginationBar from "../../components/AccountList/AccountPaginationBar";
import EditAccountModal from "../../components/AccountList/EditAccountModal";
import CreateAccountModal from "../../components/AccountList/CreateAccountModal";
import ManageRolesModal from "../../components/AccountList/ManageRolesModal";
import LockAccountModal from "../../components/AccountList/LockAccountModal";
import UnlockAccountModal from "../../components/AccountList/UnlockAccountModal";
import ImportExcelUI from "../../components/Recruitment/ImportExcelUI";
import Sidebar from "../../components/layout/Sidebar";
import { usePermission } from "../../hooks/usePermission";
import type { SessionDraftDialog } from "../../services/sessionDraft.service";

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_DELAY_MS = 350;

const INITIAL_FILTERS: AccountFilterParams = {
  searchKeyword: "",
  role: "ALL",
  status: "ALL",
};

export const AccountListPage: React.FC = () => {
  // Account list, counts and server pagination state
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalSystemUsers, setTotalSystemUsers] = useState<number>(0);
  const [reloadKey, setReloadKey] = useState(0);

  // Filter and pagination controls
  const [filterParams, setFilterParams] =
    useState<AccountFilterParams>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Asynchronous states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modal editing state
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Modal managing roles state (User Story S1-09 / TKNHTTDNB1-152)
  const [managingRolesAccount, setManagingRolesAccount] =
    useState<UserAccount | null>(null);
  const [isManageRolesModalOpen, setIsManageRolesModalOpen] =
    useState<boolean>(false);
  const [showImportExcel, setShowImportExcel] = useState<boolean>(false);

  // Modal locking & unlocking state (User Story S1-10 / TKNHTTDNB1-160)
  const [lockingAccount, setLockingAccount] = useState<UserAccount | null>(
    null,
  );
  const [isLockModalOpen, setIsLockModalOpen] = useState<boolean>(false);
  const [unlockingAccount, setUnlockingAccount] = useState<UserAccount | null>(
    null,
  );
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const pendingDraftDialog = useRef<SessionDraftDialog | null>(null);
  const accountsRef = useRef<UserAccount[]>([]);
  const isLoadingRef = useRef(true);

  const { notify } = useToast();
  const { can } = usePermission();
  const canManageAccounts = can("edit", "user");

  // Debounce search keyword to avoid flooding API requests while typing
  const debouncedSearchKeyword = useDebounce(
    filterParams.searchKeyword,
    SEARCH_DEBOUNCE_DELAY_MS,
  );

  const showNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => notify(message, type);

  useEffect(() => {
    accountsRef.current = accounts;
    isLoadingRef.current = isLoading;
  }, [accounts, isLoading]);

  const openDraftDialog = (
    dialog: SessionDraftDialog,
    sourceAccounts: UserAccount[],
  ) => {
    if (dialog.type === "create-account") {
      setIsCreateModalOpen(true);
      return;
    }
    const account = sourceAccounts.find((item) => item.id === dialog.id);
    if (!account) return;

    if (dialog.type === "edit-account") {
      setEditingAccount(account);
      setIsEditModalOpen(true);
    } else if (dialog.type === "manage-roles") {
      setManagingRolesAccount(account);
      setIsManageRolesModalOpen(true);
    } else if (dialog.type === "lock-account") {
      setLockingAccount(account);
      setIsLockModalOpen(true);
    } else if (dialog.type === "unlock-account") {
      setUnlockingAccount(account);
      setIsUnlockModalOpen(true);
    }
  };

  useEffect(() => {
    const restoreDialog = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const detail: unknown = event.detail;
      if (
        typeof detail !== "object" ||
        detail === null ||
        !("type" in detail) ||
        typeof detail.type !== "string"
      )
        return;
      const dialog = {
        type: detail.type,
        id:
          "id" in detail && typeof detail.id === "string"
            ? detail.id
            : undefined,
      };
      if (isLoadingRef.current) pendingDraftDialog.current = dialog;
      else openDraftDialog(dialog, accountsRef.current);
    };
    window.addEventListener("session-draft:restore-dialog", restoreDialog);
    return () =>
      window.removeEventListener("session-draft:restore-dialog", restoreDialog);
  }, []);

  // Fetch accounts from API whenever search, filter, or pagination changes
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      isLoadingRef.current = true;
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
          accountsRef.current = response.users;
          setAccounts(response.users);
          setTotalItems(response.totalItems);
          setTotalPages(response.totalPages);

          // Store total count on initial load when no filter is applied
          if (
            !debouncedSearchKeyword &&
            filterParams.role === "ALL" &&
            filterParams.status === "ALL"
          ) {
            setTotalSystemUsers(response.totalItems);
          }
          if (pendingDraftDialog.current) {
            openDraftDialog(pendingDraftDialog.current, response.users);
            pendingDraftDialog.current = null;
          }
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : "Không thể kết nối đến máy chủ để lấy danh sách tài khoản.";
          setApiError(message);
          setAccounts([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } finally {
        if (isMounted) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [
    debouncedSearchKeyword,
    filterParams.role,
    filterParams.status,
    currentPage,
    pageSize,
    reloadKey,
  ]);

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
                status: result.status,
                lockReason: result.lockReason ?? reason.trim(),
                lockedAt: result.lockedAt ?? undefined,
              }
            : item,
        ),
      );

      showNotification(`Đã khóa thành công tài khoản. Lý do: "${reason}"`);
      if (result.handoverWarning) showNotification(result.handoverWarning);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Lỗi khi thực hiện khóa tài khoản.";
      showNotification(message, "error");
      throw error;
    }
  };

  // Handler for confirming unlock via API (User Story S1-10 / TKNHTTDNB1-160)
  const handleConfirmUnlock = async (userId: string) => {
    try {
      const result = await userService.unlockUser(userId);

      setAccounts((prevList) =>
        prevList.map((item) =>
          item.id === userId
            ? {
                ...item,
                status: result.status,
                lockReason: result.lockReason ?? undefined,
                lockedAt: result.lockedAt ?? undefined,
              }
            : item,
        ),
      );

      showNotification(
        result.status === "ACTIVE"
          ? "Đã mở khóa thành công tài khoản người dùng."
          : `Đã gỡ khóa quản trị. Trạng thái tài khoản hiện tại: ${result.status}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lỗi khi mở khóa tài khoản.";
      showNotification(message, "error");
      throw error;
    }
  };

  // Handler for toggling status (Active <-> Locked) via API (fallback)
  const handleToggleStatus = async (account: UserAccount) => {
    if (account.status === "ACTIVE") {
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
      const account = accounts.find((item) => item.id === userId);
      if (!account)
        throw new Error("Không tìm thấy tài khoản cần cập nhật vai trò.");
      const currentRoles = account.roles?.length
        ? account.roles
        : [account.role];
      await userService.updateUserRoles(userId, currentRoles, newRoles);

      setAccounts((prevList) =>
        prevList.map((item) =>
          item.id === userId
            ? { ...item, roles: newRoles, role: newRoles[0] }
            : item,
        ),
      );

      showNotification("Cập nhật phân quyền vai trò người dùng thành công.");
    } catch (error) {
      setReloadKey((current) => current + 1);
      const message =
        error instanceof Error
          ? error.message
          : "Lỗi khi cập nhật vai trò người dùng.";
      showNotification(message, "error");
      throw error;
    }
  };

  // Handler for saving edited account via API
  const handleSaveAccount = async (updatedAccount: UserAccount) => {
    try {
      const savedAccount = await userService.updateUser(updatedAccount);

      setAccounts((prevList) =>
        prevList.map((item) =>
          item.id === savedAccount.id ? savedAccount : item,
        ),
      );

      showNotification(
        `Đã cập nhật thông tin tài khoản: ${savedAccount.fullName}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lỗi khi cập nhật tài khoản.";
      showNotification(message, "error");
      throw error;
    }
  };

  const handleAccountCreated = (message: string) => {
    showNotification(message);
    setCurrentPage(1);
    setReloadKey((current) => current + 1);
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
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Danh sách tài khoản nội bộ
                </h1>
                {canManageAccounts && (
                  <>
                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsCreateModalOpen(true)}
                      type="button"
                    >
                      <span aria-hidden="true" className="text-lg leading-none">
                        +
                      </span>
                      Tạo tài khoản
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      onClick={() => setShowImportExcel((current) => !current)}
                      type="button"
                    >
                      <span
                        aria-hidden="true"
                        className="text-base leading-none"
                      >
                        ⬇
                      </span>
                      {showImportExcel ? "Ẩn Import Excel" : "Import Excel"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick stats tags */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
                Tổng cộng:{" "}
                <strong className="text-indigo-600">
                  {totalSystemUsers || totalItems}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs">
                Kết quả: <strong>{totalItems}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
                Trang:{" "}
                <strong>
                  {currentPage}/{totalPages}
                </strong>
              </span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
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

          {showImportExcel && (
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <ImportExcelUI
                onSuccess={() => {
                  setReloadKey((prev) => prev + 1);
                }}
                onClose={() => setShowImportExcel(false)}
              />
            </div>
          )}

          {/* Data Table Component with Loading Skeleton */}
          <div className="space-y-0">
            <AccountTable
              accounts={accounts}
              isLoading={isLoading}
              onEditAccount={
                canManageAccounts ? handleOpenEditModal : undefined
              }
              onManageRoles={
                canManageAccounts ? handleOpenManageRoles : undefined
              }
              onRequestLock={canManageAccounts ? handleRequestLock : undefined}
              onRequestUnlock={
                canManageAccounts ? handleRequestUnlock : undefined
              }
              onToggleStatus={
                canManageAccounts ? handleToggleStatus : undefined
              }
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
        isOpen={isEditModalOpen && canManageAccounts}
        account={editingAccount}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveAccount}
      />
      <CreateAccountModal
        isOpen={isCreateModalOpen && canManageAccounts}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleAccountCreated}
      />

      {/* Manage Roles Modal (User Story S1-09 / TKNHTTDNB1-152) */}
      <ManageRolesModal
        isOpen={isManageRolesModalOpen && canManageAccounts}
        account={managingRolesAccount}
        onClose={() => setIsManageRolesModalOpen(false)}
        onSaveRoles={handleSaveRoles}
      />

      {/* Lock Account Modal with Reason & Headcount Warning (User Story S1-10 / TKNHTTDNB1-160) */}
      <LockAccountModal
        isOpen={isLockModalOpen && canManageAccounts}
        account={lockingAccount}
        onClose={() => setIsLockModalOpen(false)}
        onConfirmLock={handleConfirmLock}
      />

      {/* Unlock Account Modal (User Story S1-10 / TKNHTTDNB1-160) */}
      <UnlockAccountModal
        isOpen={isUnlockModalOpen && canManageAccounts}
        account={unlockingAccount}
        onClose={() => setIsUnlockModalOpen(false)}
        onConfirmUnlock={handleConfirmUnlock}
      />
    </div>
  );
};

export default AccountListPage;
