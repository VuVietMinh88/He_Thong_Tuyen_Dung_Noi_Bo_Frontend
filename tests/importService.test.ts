import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import {
  importService,
  validateImportFile,
  MAX_IMPORT_FILE_SIZE_BYTES,
  type PreviewResponse,
  type ImportReport,
} from '../src/services/import.service';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('validateImportFile', () => {
  it('rejects null or undefined file', () => {
    expect(validateImportFile(null)).toBe('Vui lòng chọn một tệp Excel để tải lên.');
    expect(validateImportFile(undefined)).toBe('Vui lòng chọn một tệp Excel để tải lên.');
  });

  it('rejects files with invalid extensions (e.g. .xls, .csv, .txt)', () => {
    const fileXls = new File(['content'], 'nhansu.xls', { type: 'application/vnd.ms-excel' });
    expect(validateImportFile(fileXls)).toContain('chỉ hỗ trợ tệp Excel (.xlsx)');

    const fileCsv = new File(['content'], 'nhansu.csv', { type: 'text/csv' });
    expect(validateImportFile(fileCsv)).toContain('chỉ hỗ trợ tệp Excel (.xlsx)');
  });

  it('rejects empty file (0 bytes)', () => {
    const emptyFile = new File([], 'nhansu.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    expect(validateImportFile(emptyFile)).toContain('0 bytes');
  });

  it('rejects files exceeding 2MB limit', () => {
    const largeContent = new Uint8Array(MAX_IMPORT_FILE_SIZE_BYTES + 1024);
    const largeFile = new File([largeContent], 'nhansu.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    expect(validateImportFile(largeFile)).toContain('vượt quá dung lượng tối đa 2MB');
  });

  it('accepts valid .xlsx file within size limit', () => {
    const validFile = new File(['sample content'], 'nhansu.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    expect(validateImportFile(validFile)).toBeNull();
  });
});

describe('importService.preview', () => {
  it('calls POST /accounts/import/preview with multipart FormData', async () => {
    const mockResponse: PreviewResponse = {
      totalRows: 2,
      validRows: 1,
      invalidRows: 1,
      rows: [
        {
          rowNumber: 2,
          email: 'nguyen.van.an@example.com',
          fullName: 'Nguyễn Văn An',
          roles: ['RECRUITER'],
          departmentCode: 'HR',
          phone: '0912345678',
          displayTitle: 'Chuyên viên tuyển dụng',
          valid: true,
          errors: [],
        },
        {
          rowNumber: 3,
          email: 'tran.thi.binh@example.com',
          fullName: null,
          roles: ['HR_MANAGER'],
          departmentCode: null,
          phone: null,
          displayTitle: null,
          valid: false,
          errors: [
            {
              rowNumber: 3,
              column: 'fullName',
              cell: 'B3',
              code: 'REQUIRED',
              message: 'Họ và tên là bắt buộc.',
            },
          ],
        },
      ],
    };

    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
      data: mockResponse,
    });

    const file = new File(['dummy xlsx data'], 'nhansu.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = await importService.preview(file);

    expect(result).toEqual(mockResponse);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      '/accounts/import/preview',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': undefined },
        timeout: 60000,
      }),
    );
  });

  it('rejects when client-side validation fails without making HTTP request', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post');
    const invalidFile = new File(['dummy'], 'nhansu.pdf');

    await expect(importService.preview(invalidFile)).rejects.toThrow(
      'Hệ thống chỉ hỗ trợ tệp Excel (.xlsx).',
    );
    expect(postSpy).not.toHaveBeenCalled();
  });
});

describe('importService.importFile', () => {
  it('calls POST /accounts/import with multipart FormData', async () => {
    const mockReport: ImportReport = {
      totalRows: 2,
      createdCount: 1,
      skippedCount: 1,
      stoppedAtRow: null,
      created: [
        {
          rowNumber: 2,
          email: 'nguyen.van.an@example.com',
          accountId: 'uuid-1',
        },
      ],
      skipped: [
        {
          rowNumber: 3,
          email: 'tran.thi.binh@example.com',
          errors: [
            {
              rowNumber: 3,
              column: 'fullName',
              cell: 'B3',
              code: 'REQUIRED',
              message: 'Họ và tên là bắt buộc.',
            },
          ],
        },
      ],
    };

    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
      data: mockReport,
    });

    const file = new File(['dummy xlsx data'], 'nhansu.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = await importService.importFile(file);

    expect(result).toEqual(mockReport);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      '/accounts/import',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': undefined },
        timeout: 180000,
      }),
    );
  });
});

describe('importService.downloadTemplate', () => {
  it('calls GET /accounts/import/template with blob responseType', async () => {
    const dummyBlob = new Blob(['sample excel template']);
    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
      data: dummyBlob,
    });

    const result = await importService.downloadTemplate();

    expect(result).toEqual(dummyBlob);
    expect(getSpy).toHaveBeenCalledWith('/accounts/import/template', {
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      timeout: 30000,
    });
  });
});
