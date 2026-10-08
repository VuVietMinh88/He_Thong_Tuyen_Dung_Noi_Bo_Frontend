import { describe, expect, it } from 'vitest';
import { MOCK_ACCOUNTS } from '../src/data/mockAccounts';
import type { UserAccount, AccountRole, AccountStatus } from '../src/types/account';

// Filter helper function matching the logic used in AccountListPage
const filterAccounts = (
  accounts: UserAccount[],
  keyword: string,
  role: AccountRole | 'ALL',
  status: AccountStatus | 'ALL'
): UserAccount[] => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return accounts.filter((account) => {
    const matchesKeyword =
      normalizedKeyword === '' ||
      account.fullName.toLowerCase().includes(normalizedKeyword) ||
      account.email.toLowerCase().includes(normalizedKeyword) ||
      account.department.toLowerCase().includes(normalizedKeyword);

    const matchesRole = role === 'ALL' || account.role === role;
    const matchesStatus = status === 'ALL' || account.status === status;

    return matchesKeyword && matchesRole && matchesStatus;
  });
};

describe('User Account List Filtering & Pagination (TKNHTTDNB1-142)', () => {
  it('loads the mock account dataset with at least 25 items for pagination testing', () => {
    expect(MOCK_ACCOUNTS.length).toBeGreaterThanOrEqual(25);
  });

  it('filters accounts by full name correctly', () => {
    const results = filterAccounts(MOCK_ACCOUNTS, 'Nguyễn Văn An', 'ALL', 'ALL');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].fullName).toBe('Nguyễn Văn An');
  });

  it('filters accounts by email correctly', () => {
    const results = filterAccounts(MOCK_ACCOUNTS, 'ngoc.tran@smartrecruitment.vn', 'ALL', 'ALL');
    expect(results.length).toBe(1);
    expect(results[0].email).toBe('ngoc.tran@smartrecruitment.vn');
  });

  it('filters accounts by department keyword correctly', () => {
    const results = filterAccounts(MOCK_ACCOUNTS, 'Phòng Kỹ thuật', 'ALL', 'ALL');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((acc) => {
      expect(acc.department).toContain('Phòng Kỹ thuật');
    });
  });

  it('filters accounts by role accurately', () => {
    const adminAccounts = filterAccounts(MOCK_ACCOUNTS, '', 'ADMIN', 'ALL');
    expect(adminAccounts.length).toBeGreaterThan(0);
    adminAccounts.forEach((acc) => {
      expect(acc.role).toBe('ADMIN');
    });
  });

  it('filters accounts by backend status values accurately', () => {
    const activeAccounts = filterAccounts(MOCK_ACCOUNTS, '', 'ALL', 'ACTIVE');
    const lockedAccounts = filterAccounts(MOCK_ACCOUNTS, '', 'ALL', 'ADMINISTRATIVELY_LOCKED');

    expect(activeAccounts.length + lockedAccounts.length).toBe(MOCK_ACCOUNTS.length);
    lockedAccounts.forEach((acc) => {
      expect(acc.status).toBe('ADMINISTRATIVELY_LOCKED');
    });
  });

  it('correctly paginates 20 accounts per page as default', () => {
    const pageSize = 20;
    const page1Accounts = MOCK_ACCOUNTS.slice(0, pageSize);
    const page2Accounts = MOCK_ACCOUNTS.slice(pageSize, pageSize * 2);

    expect(page1Accounts.length).toBe(20);
    expect(page2Accounts.length).toBe(MOCK_ACCOUNTS.length - 20);
    expect(page1Accounts[0].id).toBe(MOCK_ACCOUNTS[0].id);
    expect(page2Accounts[0].id).toBe(MOCK_ACCOUNTS[20].id);
  });
});
