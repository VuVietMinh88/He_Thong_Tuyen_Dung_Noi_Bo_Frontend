import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { profileService } from '../src/services/profileService';
import { UserProfileUI } from '../src/components/Profile/UserProfileUI';
import { AvatarUploadUI } from '../src/components/Profile/AvatarUploadUI';
import ToastProvider from '../src/components/notifications/ToastProvider';

describe('Profile Phone Check & Avatar UI Enhancement (Tasks 2 & 3)', () => {
  describe('profileService.checkPhoneAvailability', () => {
    it('returns available: true for an unassigned phone number', async () => {
      const result = await profileService.checkPhoneAvailability('0919998888', 'USR-001');
      expect(result.available).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('returns available: false with Vietnamese message when phone exists on another account', async () => {
      // '0987654321' belongs to USR-002 in mock accounts
      const result = await profileService.checkPhoneAvailability('0987654321', 'USR-001');
      expect(result.available).toBe(false);
      expect(result.message).toBe('Số điện thoại này đã được đăng ký bởi tài khoản khác trong hệ thống.');
    });

    it('returns available: true when the phone number belongs to the current user themselves', async () => {
      // USR-002 checking their own phone number 0987654321
      const result = await profileService.checkPhoneAvailability('0987654321', 'USR-002');
      expect(result.available).toBe(true);
    });

    it('returns available: true for empty or whitespace-only phone', async () => {
      const result = await profileService.checkPhoneAvailability('   ', 'USR-001');
      expect(result.available).toBe(true);
    });
  });

  describe('Avatar Frame & Camera Icon UI (Task 3)', () => {
    it('renders camera icon button at bottom-right corner of avatar frame in UserProfileUI', () => {
      const html = renderToString(
        <MemoryRouter>
          <ToastProvider>
            <UserProfileUI
              initialData={{
                id: 'USR-001',
                email: 'test@example.com',
                fullName: 'Nguyễn Văn An',
                phone: '0912345678',
                displayTitle: 'HR Specialist',
                departmentName: 'Phòng Nhân sự',
                roles: ['RECRUITER'],
                hasAvatar: false,
              }}
            />
          </ToastProvider>
        </MemoryRouter>
      );

      // Camera button exists on avatar frame
      expect(html).toContain('id="avatar-camera-btn"');
      expect(html).toContain('absolute -bottom-1 -right-1');
      expect(html).toContain('Đổi ảnh đại diện');
    });

    it('renders camera icon at bottom-right of avatar and does NOT contain redundant "Ảnh đại diện cá nhân" in AvatarUploadUI', () => {
      const html = renderToString(
        <AvatarUploadUI
          fullName="Nguyễn Văn An"
          hasAvatar={false}
          onCancel={vi.fn()}
        />
      );

      // 1. Camera icon positioned at bottom-right of the avatar
      expect(html).toContain('absolute bottom-1 right-1');
      expect(html).toContain('title="Đổi ảnh đại diện"');

      // 2. Redundant heading "Ảnh đại diện cá nhân" is completely removed
      expect(html).not.toContain('Ảnh đại diện cá nhân');
    });
  });
});
