import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import {
  profileService,
  getApiErrorMessage,
  type ProfileResponse,
} from '../src/services/profileService';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('profileService (TKNHTTDNB1-183)', () => {
  const mockBackendProfile: ProfileResponse = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'interviewer@example.com',
    fullName: 'Nguyễn Văn An',
    phone: '0912345678',
    displayTitle: 'Chuyên viên tuyển dụng',
    departmentId: null,
    departmentName: null,
    roles: ['INTERVIEWER'],
    hasAvatar: true,
    avatarUpdatedAt: '2026-10-07T08:00:00Z',
  };

  it('calls GET /profile and returns profile data', async () => {
    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
      data: mockBackendProfile,
    });

    const result = await profileService.getProfile();

    expect(result).toEqual(mockBackendProfile);
    expect(getSpy).toHaveBeenCalledWith('/profile');
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('calls PUT /profile with trimmed payload and returns updated profile', async () => {
    const updatedBackendProfile: ProfileResponse = {
      ...mockBackendProfile,
      fullName: 'Nguyễn Văn Bình',
      phone: '0987654321',
      displayTitle: 'Trưởng nhóm tuyển dụng',
    };

    const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
      data: updatedBackendProfile,
    });

    const result = await profileService.updateProfile({
      fullName: '  Nguyễn Văn Bình  ',
      phone: ' 0987654321 ',
      displayTitle: ' Trưởng nhóm tuyển dụng ',
    });

    expect(result).toEqual(updatedBackendProfile);
    expect(putSpy).toHaveBeenCalledWith('/profile', {
      fullName: 'Nguyễn Văn Bình',
      phone: '0987654321',
      displayTitle: 'Trưởng nhóm tuyển dụng',
    });
  });

  it('converts empty phone and displayTitle to null in PUT payload', async () => {
    const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
      data: {
        ...mockBackendProfile,
        phone: null,
        displayTitle: null,
      },
    });

    await profileService.updateProfile({
      fullName: 'Nguyễn Văn An',
      phone: '   ',
      displayTitle: '',
    });

    expect(putSpy).toHaveBeenCalledWith('/profile', {
      fullName: 'Nguyễn Văn An',
      phone: null,
      displayTitle: null,
    });
  });

  describe('getApiErrorMessage helper', () => {
    it('returns custom message from error response', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Số điện thoại không hợp lệ.' },
        },
      };
      expect(getApiErrorMessage(axiosError, 'Lỗi mặc định')).toBe('Số điện thoại không hợp lệ.');
    });

    it('returns permission message on 403 status', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {},
        },
      };
      expect(getApiErrorMessage(axiosError, 'Lỗi mặc định')).toBe(
        'Bạn không có quyền cập nhật hồ sơ cá nhân.',
      );
    });

    it('returns session expired message on 401 status', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {},
        },
      };
      expect(getApiErrorMessage(axiosError, 'Lỗi mặc định')).toBe(
        'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
      );
    });
  });
});
