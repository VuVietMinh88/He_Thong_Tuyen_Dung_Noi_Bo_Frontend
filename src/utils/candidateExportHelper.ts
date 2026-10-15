import * as XLSX from 'xlsx';
import type {
  CandidateProfile,
  CvParsingStatus,
  CandidateExportResult,
} from '../types/candidate';

/**
 * Tạo tên file xuất Excel chuẩn theo quy định hệ thống:
 * Danh_sach_ung_vien_YYYYMMDD_HHmm.xlsx (Task Jira TKNHTTDNB1-422 / User Story S5-08)
 */
export const generateCandidateExportFilename = (
  date: Date = new Date(),
  format: 'xlsx' | 'csv' = 'xlsx'
): string => {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');

  return `Danh_sach_ung_vien_${yyyy}${MM}${dd}_${HH}${mm}.${format}`;
};

/**
 * Chuyển đổi trạng thái bóc tách CV sang tiếng Việt rõ nghĩa
 */
export const formatCvParsingStatus = (status?: CvParsingStatus): string => {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return 'Chờ xác nhận gợi ý';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'PARSING':
      return 'Đang đọc CV PDF';
    case 'FAILED':
      return 'Lỗi đọc CV';
    case 'DISMISSED':
      return 'Đã bỏ qua';
    default:
      return 'Chưa xử lý';
  }
};

/**
 * Định dạng thời gian ứng tuyển sang định dạng ngày giờ Việt Nam
 */
export const formatAppliedDate = (dateString?: string): string => {
  if (!dateString) return 'Mới đây';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

/**
 * Cấu trúc hàng dữ liệu xuất Excel cho ứng viên
 */
export interface CandidateExcelRow {
  'STT': number;
  'Mã ứng viên': string;
  'Họ và tên': string;
  'Email': string;
  'Số điện thoại': string;
  'Vị trí ứng tuyển': string;
  'Phòng ban': string;
  'Trạng thái / Vòng tuyển dụng': string;
  'Điểm phù hợp': string;
  'Đánh giá sao': string;
  'Năm kinh nghiệm': string | number;
  'Trình độ học vấn': string;
  'Kỹ năng': string;
  'Nguồn ứng tuyển': string;
  'Trạng thái bóc tách CV': string;
  'Tệp CV': string;
  'Thời điểm ứng tuyển': string;
  'Ghi chú': string;
}

/**
 * Ánh xạ danh sách CandidateProfile sang định dạng các cột hiển thị trong tệp Excel
 */
export const mapCandidatesToExcelRows = (
  candidates: CandidateProfile[]
): CandidateExcelRow[] => {
  return candidates.map((candidate, index) => {
    // 1. Điểm phù hợp gợi ý
    let scoreText = 'N/A';
    if (candidate.matchingEvaluation?.totalMatchingScore !== undefined) {
      scoreText = `${candidate.matchingEvaluation.totalMatchingScore}%`;
    }

    // 2. Đánh giá sao
    const ratingText = candidate.rating ? `${candidate.rating}/5 sao` : 'Chưa đánh giá';

    // 3. Kinh nghiệm làm việc
    const experienceText =
      candidate.experienceYears !== undefined && candidate.experienceYears !== null
        ? `${candidate.experienceYears} năm`
        : 'Chưa cập nhật';

    // 4. Kỹ năng chuyên môn
    const skillsText =
      candidate.skills && candidate.skills.length > 0
        ? candidate.skills.join(', ')
        : 'Chưa cập nhật';

    // 5. Ghi chú nội bộ
    const notesText =
      candidate.notes && candidate.notes.length > 0
        ? candidate.notes.map((n) => `[${n.authorName || 'Nhân sự'}]: ${n.content}`).join(' | ')
        : candidate.coverLetter || '';

    return {
      'STT': index + 1,
      'Mã ứng viên': candidate.trackingCode || candidate.id,
      'Họ và tên': candidate.fullName || '',
      'Email': candidate.email || '',
      'Số điện thoại': candidate.phone || '',
      'Vị trí ứng tuyển': candidate.appliedJobTitle || 'Chưa xác định',
      'Phòng ban': candidate.departmentName || 'Chưa phân bổ',
      'Trạng thái / Vòng tuyển dụng': candidate.status || 'Mới tiếp nhận',
      'Điểm phù hợp': scoreText,
      'Đánh giá sao': ratingText,
      'Năm kinh nghiệm': experienceText,
      'Trình độ học vấn': candidate.educationLevel || 'Chưa cập nhật',
      'Kỹ năng': skillsText,
      'Nguồn ứng tuyển': candidate.source || 'Website công ty',
      'Trạng thái bóc tách CV': formatCvParsingStatus(candidate.cvParsingStatus),
      'Tệp CV': candidate.cvFileName || 'N/A',
      'Thời điểm ứng tuyển': formatAppliedDate(candidate.appliedAt),
      'Ghi chú': notesText,
    };
  });
};

/**
 * Tải file Blob về máy tính người dùng bằng cách kích hoạt thẻ a download
 */
export const downloadBlobFile = (blob: Blob, filename: string): void => {
  if (typeof window === 'undefined' || !window.URL) {
    return;
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = blobUrl;
  downloadAnchor.download = filename;
  downloadAnchor.setAttribute('data-testid', 'export-download-link');
  downloadAnchor.style.display = 'none';

  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);

  setTimeout(() => {
    if (typeof window !== 'undefined' && window?.URL?.revokeObjectURL) {
      window.URL.revokeObjectURL(blobUrl);
    }
  }, 300);
};

/**
 * Tạo Blob chứa tệp Excel (.xlsx) từ danh sách CandidateProfile bằng thư viện SheetJS
 */
export const exportCandidatesToExcelBlob = (
  candidates: CandidateProfile[]
): Blob => {
  const rows = mapCandidatesToExcelRows(candidates);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Thiết lập độ rộng cột (Column Widths) để hiển thị dữ liệu đẹp mắt, không bị che khuất
  const colWidths = [
    { wch: 6 },  // STT
    { wch: 20 }, // Mã ứng viên
    { wch: 26 }, // Họ và tên
    { wch: 30 }, // Email
    { wch: 16 }, // Số điện thoại
    { wch: 35 }, // Vị trí ứng tuyển
    { wch: 26 }, // Phòng ban
    { wch: 24 }, // Trạng thái / Vòng tuyển dụng
    { wch: 15 }, // Điểm phù hợp
    { wch: 16 }, // Đánh giá sao
    { wch: 18 }, // Năm kinh nghiệm
    { wch: 24 }, // Trình độ học vấn
    { wch: 32 }, // Kỹ năng
    { wch: 22 }, // Nguồn ứng tuyển
    { wch: 24 }, // Trạng thái bóc tách CV
    { wch: 30 }, // Tệp CV
    { wch: 20 }, // Thời điểm ứng tuyển
    { wch: 45 }, // Ghi chú
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách ứng viên');

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

/**
 * Xuất danh sách ứng viên trực tiếp ra tệp Excel (.xlsx) và kích hoạt tải về
 */
export const exportCandidatesToExcel = async (
  candidates: CandidateProfile[],
  customFilename?: string
): Promise<CandidateExportResult> => {
  if (!candidates || candidates.length === 0) {
    throw new Error('Danh sách ứng viên rỗng, không có dữ liệu để xuất file Excel.');
  }

  const filename = customFilename || generateCandidateExportFilename(new Date(), 'xlsx');
  const blob = exportCandidatesToExcelBlob(candidates);
  downloadBlobFile(blob, filename);

  return {
    filename,
    count: candidates.length,
    format: 'xlsx',
  };
};

/**
 * Xuất danh sách ứng viên ra tệp CSV kèm mã hóa UTF-8 BOM để Excel hiển thị đúng tiếng Việt
 */
export const exportCandidatesToCsv = async (
  candidates: CandidateProfile[],
  customFilename?: string
): Promise<CandidateExportResult> => {
  if (!candidates || candidates.length === 0) {
    throw new Error('Danh sách ứng viên rỗng, không có dữ liệu để xuất file CSV.');
  }

  const filename = customFilename || generateCandidateExportFilename(new Date(), 'csv');
  const rows = mapCandidatesToExcelRows(candidates);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Thêm UTF-8 BOM (\uFEFF) để Excel tự nhận diện đúng bảng mã tiếng Việt
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  downloadBlobFile(blob, filename);

  return {
    filename,
    count: candidates.length,
    format: 'csv',
  };
};
