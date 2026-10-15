/**
 * Candidate Sources Quality Report Excel Export Helper (Jira TKNHTTDNB1-579 - User Story S9-02)
 * Sử dụng thư viện xlsx để tạo và tải về tệp Excel định dạng .xlsx
 */

import * as XLSX from 'xlsx';
import type {
  CandidateSourceMetric,
  SourceQualityReportData,
} from '../types/candidateSourceReport';

/**
 * Tạo tên file xuất Excel chuẩn theo quy định:
 * Bao_cao_chat_luong_nguon_YYYYMMDD.xlsx (Task Jira TKNHTTDNB1-579)
 */
export const generateSourceReportFilename = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `Bao_cao_chat_luong_nguon_${yyyy}${mm}${dd}.xlsx`;
};

/**
 * Chuyển đổi mã phân hạng chất lượng sang tiếng Việt chuẩn
 */
export const formatQualityTierLabel = (tier: string): string => {
  switch (tier) {
    case 'EXCELLENT':
      return 'Xuất sắc (Hiệu quả cao)';
    case 'GOOD':
      return 'Đạt chuẩn (Khá)';
    case 'AVERAGE':
      return 'Trung bình';
    case 'POOR':
      return 'Cần cải thiện (Kém)';
    default:
      return tier;
  }
};

/**
 * Xây dựng Blob tệp Excel (.xlsx) chứa đầy đủ bảng số liệu chi tiết,
 * tỷ lệ chuyển đổi và các thông số bộ lọc đang chọn.
 */
export const createSourceReportExcelBlob = (
  reportData: SourceQualityReportData,
): Blob => {
  const { filters, kpi, sources } = reportData;

  // 1. Sheet 1: Bảng dữ liệu chi tiết chất lượng nguồn
  const headerInfo = [
    ['HỆ THỐNG TUYỂN DỤNG THÔNG MINH - SMART RECRUITMENT SYSTEM'],
    ['BÁO CÁO ĐÁNH GIÁ CHẤT LƯỢNG CÁC KÊNH NGUỒN ỨNG VIÊN'],
    [''],
    ['Kỳ báo cáo:', `${filters.startDate} đến ${filters.endDate}`],
    ['Preset thời gian:', filters.datePreset],
    ['Khối / Phòng ban:', filters.departmentId === 'ALL' ? 'Tất cả phòng ban' : filters.departmentId],
    ['Vị trí tuyển dụng:', filters.jobOpeningId === 'ALL' ? 'Tất cả vị trí' : filters.jobOpeningId],
    ['Chiến dịch tuyển dụng:', filters.campaignId === 'ALL' ? 'Tất cả chiến dịch' : filters.campaignId],
    ['Thời điểm xuất báo cáo:', new Date().toLocaleString('vi-VN')],
    [''],
  ];

  const tableHeaders = [
    'STT',
    'Kênh tuyển dụng',
    'Loại kênh',
    'Tổng hồ sơ tiếp nhận',
    'Đạt lọc hồ sơ',
    'Vào phỏng vấn',
    'Gửi Offer',
    'Tuyển thành công (Hired)',
    'Tỷ lệ đạt chuẩn (%)',
    'Tỷ lệ tuyển thành công (%)',
    'Tỷ lệ qua lọc (%)',
    'Tỷ lệ chốt offer (%)',
    'Mức độ hiệu quả',
    'Thời gian tuyển TB (ngày)',
    'Tỷ trọng hồ sơ (%)',
    'Tỷ trọng tuyển (%)',
  ];

  const tableRows = sources.map((s: CandidateSourceMetric, index: number) => [
    index + 1,
    s.sourceName,
    s.channelCategory,
    s.totalApplications,
    s.screenedCount,
    s.interviewCount,
    s.offeredCount,
    s.hiredCount,
    `${s.qualificationRate}%`,
    `${s.hireRate}%`,
    `${s.screeningPassRate}%`,
    `${s.offerAcceptanceRate}%`,
    formatQualityTierLabel(s.qualityTier),
    s.avgDaysToHire,
    `${s.shareOfApplications}%`,
    `${s.shareOfHires}%`,
  ]);

  const summaryRow = [
    '',
    'TỔNG CỘNG / TOÀN HỆ THỐNG',
    '',
    kpi.totalApplications,
    kpi.totalScreened,
    kpi.totalInterviews,
    kpi.totalOffers,
    kpi.totalHired,
    `${kpi.overallQualificationRate}%`,
    `${kpi.overallHireRate}%`,
    `${kpi.overallScreeningPassRate}%`,
    `${kpi.overallOfferAcceptanceRate}%`,
    'TỔNG QUAN',
    '-',
    '100%',
    '100%',
  ];

  const sheetData = [...headerInfo, tableHeaders, ...tableRows, summaryRow];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Thiết lập độ rộng cột (Column widths)
  worksheet['!cols'] = [
    { wch: 6 }, // STT
    { wch: 28 }, // Kênh tuyển dụng
    { wch: 14 }, // Loại kênh
    { wch: 18 }, // Tiếp nhận
    { wch: 16 }, // Đạt lọc
    { wch: 16 }, // Phỏng vấn
    { wch: 14 }, // Gửi Offer
    { wch: 22 }, // Tuyển thành công
    { wch: 20 }, // Tỷ lệ đạt chuẩn
    { wch: 22 }, // Tỷ lệ tuyển
    { wch: 16 }, // Qua lọc
    { wch: 18 }, // Chốt offer
    { wch: 22 }, // Mức độ hiệu quả
    { wch: 22 }, // Ngày tuyển TB
    { wch: 18 }, // Tỷ trọng hồ sơ
    { wch: 18 }, // Tỷ trọng tuyển
  ];

  // 2. Sheet 2: So sánh đối đầu & Benchmark (So sánh trực tiếp Tiếp nhận vs Tuyển dụng)
  const benchmarkRows = [
    ['BẢNG SO SÁNH ĐỐI ĐẦU HIỆU SUẤT CÁC NGUỒN ỨNG VIÊN'],
    [''],
    ['Kênh tuyển dụng', 'Hồ sơ tiếp nhận (CV)', 'Tuyển thành công (Hired)', 'Tỷ lệ chuyển đổi (%)', 'Hệ số CV/Tuyển'],
    ...sources.map((s) => [
      s.sourceName,
      s.totalApplications,
      s.hiredCount,
      `${s.hireRate}%`,
      s.hiredCount > 0 ? (s.totalApplications / s.hiredCount).toFixed(1) : 'Chưa có hire',
    ]),
    [''],
    ['DANH HIỆU DẪN ĐẦU (BENCHMARK HIGHLIGHTS)'],
    ['Nguồn mang lại lượng ứng viên lớn nhất:', kpi.highestVolumeSource?.sourceName || 'Chưa xác định', `${kpi.highestVolumeSource?.totalApplications || 0} hồ sơ`],
    ['Nguồn có tỷ lệ tuyển dụng cao nhất (ROI cao nhất):', kpi.topPerformingSource?.sourceName || 'Chưa xác định', `Tỷ lệ tuyển: ${kpi.topPerformingSource?.hireRate || 0}%`],
    ['Nguồn tuyển dụng nhanh nhất:', kpi.fastestHiringSource?.sourceName || 'Chưa xác định', `TB: ${kpi.fastestHiringSource?.avgDaysToHire || 0} ngày`],
  ];

  const benchmarkSheet = XLSX.utils.aoa_to_sheet(benchmarkRows);
  benchmarkSheet['!cols'] = [
    { wch: 32 },
    { wch: 22 },
    { wch: 24 },
    { wch: 20 },
    { wch: 20 },
  ];

  // Ghép các sheet vào workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Chất lượng nguồn ứng viên');
  XLSX.utils.book_append_sheet(workbook, benchmarkSheet, 'So sánh đối đầu & Benchmark');

  // Tạo mảng byte và Blob
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

/**
 * Kích hoạt tải về tệp Excel trên trình duyệt
 */
export const downloadSourceReportExcel = (
  reportData: SourceQualityReportData,
  customFilename?: string,
): { filename: string; size: number } => {
  const filename = customFilename || generateSourceReportFilename(new Date());
  const blob = createSourceReportExcelBlob(reportData);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    filename,
    size: blob.size,
  };
};
