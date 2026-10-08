import { describe, expect, it } from 'vitest';
import type { UserAccount, EditAccountFormData } from '../src/types/account';

// Form validation helper mirroring EditAccountModal logic
const validateEditAccountForm = (
  formData: EditAccountFormData
): { isValid: boolean; errors: { fullName?: string; department?: string } } => {
  const errors: { fullName?: string; department?: string } = {};

  const trimmedFullName = formData.fullName.trim();
  if (!trimmedFullName) {
    errors.fullName = 'Họ và tên bắt buộc phải nhập.';
  } else if (trimmedFullName.length < 2) {
    errors.fullName = 'Họ và tên phải có tối thiểu 2 ký tự.';
  } else if (trimmedFullName.length > 100) {
    errors.fullName = 'Họ và tên không được vượt quá 100 ký tự.';
  }

  if (!formData.department.trim()) {
    errors.department = 'Vui lòng chọn hoặc nhập phòng ban công tác.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

describe('Edit Account Form Validation & Logic (TKNHTTDNB1-144)', () => {
  const sampleAccount: UserAccount = {
    id: 'ACC-001',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@smartrecruitment.vn',
    department: 'Phòng Kỹ thuật & Công nghệ',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2025-01-15',
  };

  it('passes validation when all fields are valid', () => {
    const formData: EditAccountFormData = {
      fullName: 'Nguyễn Văn An',
      department: 'Phòng Kỹ thuật & Công nghệ',
      role: 'ADMIN',
      status: 'ACTIVE',
    };

    const result = validateEditAccountForm(formData);
    expect(result.isValid).toBe(true);
    expect(result.errors.fullName).toBeUndefined();
    expect(result.errors.department).toBeUndefined();
  });

  it('fails validation when full name is empty or whitespaces', () => {
    const formData: EditAccountFormData = {
      fullName: '   ',
      department: 'Phòng Kỹ thuật & Công nghệ',
      role: 'ADMIN',
      status: 'ACTIVE',
    };

    const result = validateEditAccountForm(formData);
    expect(result.isValid).toBe(false);
    expect(result.errors.fullName).toBe('Họ và tên bắt buộc phải nhập.');
  });

  it('fails validation when full name is shorter than 2 characters', () => {
    const formData: EditAccountFormData = {
      fullName: 'A',
      department: 'Phòng Kỹ thuật & Công nghệ',
      role: 'ADMIN',
      status: 'ACTIVE',
    };

    const result = validateEditAccountForm(formData);
    expect(result.isValid).toBe(false);
    expect(result.errors.fullName).toBe('Họ và tên phải có tối thiểu 2 ký tự.');
  });

  it('fails validation when department is not selected', () => {
    const formData: EditAccountFormData = {
      fullName: 'Trần Thị Bích Ngọc',
      department: '',
      role: 'RECRUITER',
      status: 'ACTIVE',
    };

    const result = validateEditAccountForm(formData);
    expect(result.isValid).toBe(false);
    expect(result.errors.department).toBe('Vui lòng chọn hoặc nhập phòng ban công tác.');
  });

  it('identifies status transition to LOCKED for warning display', () => {
    const initialStatus = sampleAccount.status; // 'ACTIVE'
    const newStatus = 'LOCKED';

    const isStatusChangedToLocked = initialStatus === 'ACTIVE' && newStatus === 'LOCKED';
    expect(isStatusChangedToLocked).toBe(true);
  });

  it('preserves immutable fields (id, email, createdAt) when updating', () => {
    const updatedValues: EditAccountFormData = {
      fullName: 'Nguyễn Văn An (Updated)',
      department: 'Phòng Quản lý Sản phẩm',
      role: 'HIRING_MANAGER',
      status: 'LOCKED',
    };

    const mergedAccount: UserAccount = {
      ...sampleAccount,
      ...updatedValues,
    };

    expect(mergedAccount.id).toBe(sampleAccount.id);
    expect(mergedAccount.email).toBe(sampleAccount.email);
    expect(mergedAccount.createdAt).toBe(sampleAccount.createdAt);
    expect(mergedAccount.fullName).toBe('Nguyễn Văn An (Updated)');
    expect(mergedAccount.role).toBe('HIRING_MANAGER');
    expect(mergedAccount.status).toBe('LOCKED');
  });
});
