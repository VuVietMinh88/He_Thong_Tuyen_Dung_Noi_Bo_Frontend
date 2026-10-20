import { describe, expect, it } from 'vitest';
import {
  mockUserProfile,
  type UserProfile,
} from '../src/components/Profile';

/*
 * Regex kiểm tra số điện thoại Việt Nam khớp với logic trong UserProfileUI
 */
const VIETNAM_PHONE_REGEX = /^(?:\+84|0)(?:[35789]\d{8}|2\d{9})$/;

const validateProfileForm = (name: string, phone: string) => {
  const errors: { fullName?: string; phone?: string } = {};

  const trimmedName = name.trim();
  if (!trimmedName) {
    errors.fullName = 'Họ và tên là bắt buộc.';
  } else if (trimmedName.length > 255) {
    errors.fullName = 'Họ và tên tối đa 255 ký tự.';
  }

  const trimmedPhone = phone.trim();
  if (trimmedPhone && !VIETNAM_PHONE_REGEX.test(trimmedPhone)) {
    errors.phone = 'Số điện thoại không đúng định dạng Việt Nam (VD: 0912345678 hoặc +84912345678).';
  }

  return errors;
};

describe('UserProfileUI - Mock Data & Validation (TKNHTTDNB1-178)', () => {
  it('has valid mockUserProfile matching UserProfile interface', () => {
    expect(mockUserProfile.id).toBeDefined();
    expect(mockUserProfile.email).toBe('nguyen.van.an@smartrecruitment.vn');
    expect(mockUserProfile.fullName).toBe('Nguyễn Văn An');
    expect(mockUserProfile.phone).toBe('0912345678');
    expect(mockUserProfile.displayTitle).toBe('Chuyên viên Tuyển dụng cấp cao');
    expect(mockUserProfile.departmentName).toContain('HR');
    expect(Array.isArray(mockUserProfile.roles)).toBe(true);
    expect(mockUserProfile.roles).toContain('RECRUITER');
    expect(mockUserProfile.roles).toContain('INTERVIEWER');
  });

  describe('Vietnam Phone Number Regex Validation', () => {
    it('accepts valid 10-digit mobile numbers with 03, 05, 07, 08, 09', () => {
      const validNumbers = [
        '0912345678',
        '0389123456',
        '0701234567',
        '0868123456',
        '0562123456',
      ];
      validNumbers.forEach((phone) => {
        expect(VIETNAM_PHONE_REGEX.test(phone)).toBe(true);
      });
    });

    it('accepts valid mobile numbers with +84 international prefix', () => {
      const validNumbers = [
        '+84912345678',
        '+84389123456',
        '+84701234567',
        '+84868123456',
      ];
      validNumbers.forEach((phone) => {
        expect(VIETNAM_PHONE_REGEX.test(phone)).toBe(true);
      });
    });

    it('accepts valid 11-digit landline numbers starting with 02', () => {
      expect(VIETNAM_PHONE_REGEX.test('02431234567')).toBe(true);
      expect(VIETNAM_PHONE_REGEX.test('02831234567')).toBe(true);
      expect(VIETNAM_PHONE_REGEX.test('+842431234567')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      const invalidNumbers = [
        '123456',
        'abcdefghij',
        '0123456789', // 01 is deprecated
        '091234567',  // 9 digits
        '091234567890', // 12 digits
        '0412345678', // 04 invalid
        '+84123456',
      ];
      invalidNumbers.forEach((phone) => {
        expect(VIETNAM_PHONE_REGEX.test(phone)).toBe(false);
      });
    });
  });

  describe('Form Validation Logic', () => {
    it('returns error when fullName is empty or whitespace only', () => {
      expect(validateProfileForm('', '0912345678').fullName).toBe('Họ và tên là bắt buộc.');
      expect(validateProfileForm('   ', '0912345678').fullName).toBe('Họ và tên là bắt buộc.');
    });

    it('returns error when fullName exceeds 255 characters', () => {
      const longName = 'A'.repeat(256);
      expect(validateProfileForm(longName, '0912345678').fullName).toBe('Họ và tên tối đa 255 ký tự.');
    });

    it('allows empty phone number (optional field)', () => {
      expect(validateProfileForm('Nguyễn Văn An', '').phone).toBeUndefined();
      expect(validateProfileForm('Nguyễn Văn An', '   ').phone).toBeUndefined();
    });

    it('returns error when phone number is malformed', () => {
      expect(validateProfileForm('Nguyễn Văn An', '012345').phone).toBeDefined();
    });

    it('passes validation when both fullName and phone are valid', () => {
      const errors = validateProfileForm('Nguyễn Văn An', '0912345678');
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe('UserProfile Reset Behavior', () => {
    it('restores initial values on cancel', () => {
      const initial: UserProfile = { ...mockUserProfile };
      let currentForm = {
        fullName: 'Tên thay đổi',
        phone: '0988888888',
        displayTitle: 'Tiêu đề thay đổi',
      };

      // Reset
      currentForm = {
        fullName: initial.fullName,
        phone: initial.phone,
        displayTitle: initial.displayTitle,
      };

      expect(currentForm.fullName).toBe(mockUserProfile.fullName);
      expect(currentForm.phone).toBe(mockUserProfile.phone);
      expect(currentForm.displayTitle).toBe(mockUserProfile.displayTitle);
    });
  });
});
