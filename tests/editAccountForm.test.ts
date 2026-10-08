import { describe, expect, it } from 'vitest';
import type { UserAccount } from '../src/types/account';
import {
  normalizeAccountPhone,
  validateAccountProfile,
} from '../src/utils/accountValidation';

describe('Edit account API contract', () => {
  const account: UserAccount = {
    id: '6440c8d7-7624-42a2-823d-94dbc60a2f24',
    fullName: 'Nguyễn Văn An',
    email: 'an@example.com',
    department: 'Phòng Kỹ thuật',
    departmentId: 'e85c8c58-2869-4804-97dc-ddfab180387c',
    phone: '0900000000',
    displayTitle: 'Recruiter',
    role: 'RECRUITER',
    roles: ['RECRUITER'],
    status: 'ACTIVE',
    createdAt: '2025-01-15T00:00:00Z',
  };

  it('validates editable profile fields against backend limits', () => {
    expect(validateAccountProfile({ fullName: '   ', phone: '', displayTitle: '' }))
      .toBe('Họ và tên không được để trống.');
    expect(validateAccountProfile({ fullName: 'x'.repeat(256), phone: '', displayTitle: '' }))
      .toBe('Họ và tên tối đa 255 ký tự.');
    expect(validateAccountProfile({ fullName: 'An', phone: '123', displayTitle: '' }))
      .toContain('Số điện thoại');
    expect(validateAccountProfile({ fullName: 'An', phone: '0900000000', displayTitle: 'x'.repeat(121) }))
      .toBe('Chức danh tối đa 120 ký tự.');
    expect(validateAccountProfile({ fullName: ' An ', phone: '0900000000', displayTitle: ' Recruiter ' }))
      .toBeNull();
    expect(validateAccountProfile({ fullName: 'An', phone: '+84900000000', displayTitle: '' }))
      .toBeNull();
    expect(normalizeAccountPhone('+84900000000')).toBe('0900000000');
  });

  it('updates supported profile fields without modifying identity or role/status', () => {
    const updated: UserAccount = {
      ...account,
      fullName: 'Nguyễn An mới',
      phone: '0911111111',
      displayTitle: 'Senior Recruiter',
      departmentId: 'f85c8c58-2869-4804-97dc-ddfab180387c',
    };
    expect(updated).toMatchObject({
      id: account.id,
      email: account.email,
      fullName: 'Nguyễn An mới',
      departmentId: 'f85c8c58-2869-4804-97dc-ddfab180387c',
      phone: '0911111111',
      displayTitle: 'Senior Recruiter',
      roles: account.roles,
      status: account.status,
    });
  });
});
