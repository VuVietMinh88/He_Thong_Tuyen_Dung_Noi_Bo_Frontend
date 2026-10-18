import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ImportExcelUI } from '../src/components/Recruitment/ImportExcelUI';
import { isRowDuplicate } from '../src/components/Recruitment/importExcelHelper';
import ToastProvider from '../src/components/notifications/ToastProvider';
import type { PreviewRow } from '../src/services/import.service';

describe('Import Excel Page & Features Enhancement (Task 1)', () => {
  describe('isRowDuplicate Detection Logic', () => {
    it('detects duplicate when error message explicitly indicates duplicate', () => {
      const row: PreviewRow = {
        rowNumber: 2,
        fullName: 'Nguyễn Văn A',
        email: 'a@example.com',
        phone: '0912345678',
        departmentCode: 'TECH',
        displayTitle: 'Dev',
        roles: ['ADMIN'],
        valid: false,
        errors: [{ rowNumber: 2, column: 'email', cell: 'C2', code: 'DUPLICATE', message: 'Email đã tồn tại trên hệ thống.' }],
      };

      expect(isRowDuplicate(row, [row])).toBe(true);
    });

    it('detects duplicate when two rows in the sheet share identical email', () => {
      const row1: PreviewRow = {
        rowNumber: 2,
        fullName: 'Nguyễn Văn A',
        email: 'duplicate@example.com',
        phone: '0912345678',
        departmentCode: 'TECH',
        displayTitle: 'Dev',
        roles: ['ADMIN'],
        valid: true,
        errors: [],
      };
      const row2: PreviewRow = {
        rowNumber: 3,
        fullName: 'Trần Văn B',
        email: 'DUPLICATE@example.com', // case-insensitive check
        phone: '0987654321',
        departmentCode: 'HR',
        displayTitle: 'Recruiter',
        roles: ['RECRUITER'],
        valid: true,
        errors: [],
      };

      expect(isRowDuplicate(row1, [row1, row2])).toBe(true);
      expect(isRowDuplicate(row2, [row1, row2])).toBe(true);
    });

    it('detects duplicate when two rows in the sheet share identical phone', () => {
      const row1: PreviewRow = {
        rowNumber: 2,
        fullName: 'Nguyễn Văn A',
        email: 'a@example.com',
        phone: '0912 345 678',
        departmentCode: 'TECH',
        displayTitle: 'Dev',
        roles: ['ADMIN'],
        valid: true,
        errors: [],
      };
      const row2: PreviewRow = {
        rowNumber: 3,
        fullName: 'Trần Văn B',
        email: 'b@example.com',
        phone: '0912345678',
        departmentCode: 'HR',
        displayTitle: 'Recruiter',
        roles: ['RECRUITER'],
        valid: true,
        errors: [],
      };

      expect(isRowDuplicate(row1, [row1, row2])).toBe(true);
      expect(isRowDuplicate(row2, [row1, row2])).toBe(true);
    });

    it('returns false for completely unique and valid rows', () => {
      const row1: PreviewRow = {
        rowNumber: 2,
        fullName: 'Nguyễn Văn A',
        email: 'a@example.com',
        phone: '0912345678',
        departmentCode: 'TECH',
        displayTitle: 'Dev',
        roles: ['ADMIN'],
        valid: true,
        errors: [],
      };
      const row2: PreviewRow = {
        rowNumber: 3,
        fullName: 'Trần Văn B',
        email: 'b@example.com',
        phone: '0987654321',
        departmentCode: 'HR',
        displayTitle: 'Recruiter',
        roles: ['RECRUITER'],
        valid: true,
        errors: [],
      };

      expect(isRowDuplicate(row1, [row1, row2])).toBe(false);
      expect(isRowDuplicate(row2, [row1, row2])).toBe(false);
    });
  });

  describe('ImportExcelUI Component Layout & Controls', () => {
    it('renders top navigation breadcrumb with link back to account list', () => {
      const html = renderToString(
        <MemoryRouter>
          <ToastProvider>
            <ImportExcelUI />
          </ToastProvider>
        </MemoryRouter>
      );

      // Verify breadcrumbs and back button
      expect(html).toContain('Quản lý tài khoản');
      expect(html).toContain('Import Excel');
      expect(html).toContain('← Quay lại danh sách tài khoản');
    });

    it('renders file upload dropzone and download template button', () => {
      const html = renderToString(
        <MemoryRouter>
          <ToastProvider>
            <ImportExcelUI />
          </ToastProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Tải file mẫu');
      expect(html).toContain('Kéo thả file Excel vào đây hoặc bấm để chọn');
      expect(html).toContain('.xlsx');
      expect(html).toContain('Tổng số dòng');
    });
  });
});
