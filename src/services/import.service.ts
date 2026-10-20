import axios from 'axios';
import axiosClient from '../utils/axiosClient';

export const MAX_IMPORT_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_IMPORT_EXTENSIONS = ['.xlsx'];

export interface PreviewError {
  rowNumber: number;
  column: string | null;
  cell: string | null;
  code: string;
  message: string;
}

export interface PreviewRow {
  rowNumber: number;
  email?: string | null;
  fullName?: string | null;
  roles?: string[];
  departmentCode?: string | null;
  phone?: string | null;
  displayTitle?: string | null;
  valid: boolean;
  errors: PreviewError[];
}

export interface PreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: PreviewRow[];
}

export interface CreatedAccountItem {
  rowNumber: number;
  email: string;
  accountId: string;
}

export interface ImportReportItem {
  rowNumber: number;
  email?: string | null;
  errors?: PreviewError[];
  accountId?: string;
}

export interface ImportReport {
  totalRows: number;
  createdCount: number;
  skippedCount: number;
  stoppedAtRow?: number | null;
  created: CreatedAccountItem[];
  skipped: ImportReportItem[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Trích xuất câu thông báo lỗi thân thiện với người dùng từ AxiosError hoặc Error chuẩn.
 */
export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const body: unknown = error.response?.data;
    if (isRecord(body) && !(body instanceof Blob)) {
      for (const field of ['message', 'error', 'detail', 'title'] as const) {
        if (typeof body[field] === 'string' && (body[field] as string).trim()) {
          return (body[field] as string).trim();
        }
      }
    }
    if (error.response?.status === 413) {
      return 'Tệp vượt quá kích thước cho phép (tối đa 2MB).';
    }
    if (error.response?.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này (yêu cầu vai trò ADMIN và quyền USER_ADMIN_WRITE_ALL).';
    }
    if (error.response?.status === 401) {
      return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
    }
    if (!error.response) {
      return 'Không thể kết nối Backend. Vui lòng kiểm tra máy chủ, mạng và cấu hình CORS.';
    }
  }
  return error instanceof Error ? error.message : fallbackMessage;
};

/**
 * Kiểm tra tính hợp lệ của tệp phía client trước khi gửi lên Backend.
 */
export const validateImportFile = (file?: File | null): string | null => {
  if (!file) {
    return 'Vui lòng chọn một tệp Excel để tải lên.';
  }
  const fileName = file.name.toLowerCase();
  if (!ALLOWED_IMPORT_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
    return 'Định dạng tệp không hợp lệ. Hệ thống chỉ hỗ trợ tệp Excel (.xlsx).';
  }
  if (file.size <= 0) {
    return 'Tệp được chọn không có dữ liệu (0 bytes).';
  }
  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return `Tệp vượt quá dung lượng tối đa 2MB (dung lượng hiện tại: ${sizeMb} MB).`;
  }
  return null;
};

/**
 * Gọi API POST /accounts/import/preview để kiểm tra và xem trước tệp Excel.
 */
const preview = async (file: File): Promise<PreviewResponse> => {
  const validationError = validateImportFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const form = new FormData();
  form.append('file', file);

  const resp = await axiosClient.post<PreviewResponse>('/accounts/import/preview', form, {
    headers: { 'Content-Type': undefined },
    timeout: 60000,
  });

  return resp.data;
};

/**
 * Gọi API POST /accounts/import để thực hiện nhập dữ liệu từ tệp Excel vào cơ sở dữ liệu.
 */
const importFile = async (file: File): Promise<ImportReport> => {
  const validationError = validateImportFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const form = new FormData();
  form.append('file', file);

  const resp = await axiosClient.post<ImportReport>('/accounts/import', form, {
    headers: { 'Content-Type': undefined },
    timeout: 180000,
  });

  return resp.data;
};

/**
 * Gọi API GET /accounts/import/template để tải tệp Excel mẫu về dạng Blob.
 */
const downloadTemplate = async (): Promise<Blob> => {
  const resp = await axiosClient.get<Blob>('/accounts/import/template', {
    responseType: 'blob',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    timeout: 30000,
  });
  return resp.data;
};

/**
 * Kích hoạt trực tiếp tải xuống file mẫu trên trình duyệt.
 */
const triggerTemplateDownload = async (defaultFilename = 'mau-nhap-nhan-su.xlsx'): Promise<void> => {
  try {
    const resp = await axiosClient.get<Blob>('/accounts/import/template', {
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      timeout: 30000,
    });

    let filename = defaultFilename;
    const disposition = resp.headers['content-disposition'] || resp.headers['Content-Disposition'];
    if (typeof disposition === 'string') {
      const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '').trim();
      }
    }

    const blobUrl = window.URL.createObjectURL(resp.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        if (json && typeof json.message === 'string' && json.message.trim()) {
          throw new Error(json.message.trim());
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== 'Unexpected token') {
          throw parseErr;
        }
      }
    }
    throw err;
  }
};

export const importService = {
  preview,
  importFile,
  downloadTemplate,
  triggerTemplateDownload,
  validateImportFile,
  getApiErrorMessage,
};

export default importService;
