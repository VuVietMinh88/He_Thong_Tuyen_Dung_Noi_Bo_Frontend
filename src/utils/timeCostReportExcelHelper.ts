import * as XLSX from 'xlsx';
import type { TimeCostReportData, TimeCostReportFilterState } from '../types/timeCostReport';

/**
 * Tạo tên file xuất Excel chuẩn theo quy định:
 * Bao_cao_thoi_gian_chi_phi_tuyen_dung_YYYYMMDD.xlsx (Jira TKNHTTDNB1-571)
 */
export const generateTimeCostReportFilename = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `Bao_cao_thoi_gian_chi_phi_tuyen_dung_${yyyy}${mm}${dd}.xlsx`;
};

/**
 * Tạo đối tượng Workbook của SheetJS với đầy đủ 3 bảng tính:
 * 1. Tong_Quan_KPI
 * 2. Theo_Phong_Ban
 * 3. Theo_Chuc_Danh
 */
export const createTimeCostReportWorkbook = (
  reportData: TimeCostReportData,
  filters?: TimeCostReportFilterState,
): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const { kpi, pipelineStages, departments, positions } = reportData;

  // =========================================================================
  // SHEET 1: TỔNG QUAN CHỈ SỐ KPI & CHI PHÍ
  // =========================================================================
  const sheet1Data: Array<Array<string | number>> = [
    ['HỆ THỐNG TUYỂN DỤNG THÔNG MINH - SMART RECRUITMENT SYSTEM'],
    ['BÁO CÁO THỜI GIAN VÀ CHI PHÍ TUYỂN DỤNG (TIME-TO-HIRE & COST-PER-HIRE)'],
    ['Ngày xuất báo cáo:', new Date().toLocaleString('vi-VN')],
    [
      'Kỳ báo cáo:',
      filters
        ? `${filters.startDate} đến ${filters.endDate} (${filters.datePreset})`
        : 'Toàn kỳ',
    ],
    ['Phòng ban:', filters?.departmentId === 'ALL' ? 'Tất cả phòng ban' : (filters?.departmentId || 'Tất cả')],
    [''],
    ['1. CHỈ SỐ CỐT LÕI (CORE METRICS)'],
    ['Chỉ số', 'Giá trị', 'Đơn vị tính', 'Ghi chú'],
    ['Thời gian tuyển dụng trung bình (Time-to-hire)', kpi.avgTimeToHire, 'Ngày', 'Tính từ khi duyệt yêu cầu tới khi nhận việc'],
    ['Số nhân sự tuyển thành công (Hired)', kpi.totalHires, 'Nhân sự', 'Đạt yêu cầu nhận việc trong kỳ'],
    ['Tổng chi phí tuyển dụng (Total Cost)', kpi.totalRecruitmentCost, 'VNĐ', 'Bao gồm phí đăng tin và thưởng giới thiệu'],
    ['Chi phí tuyển dụng trung bình (Cost-per-hire)', kpi.avgCostPerHire, 'VNĐ / nhân sự', 'Tổng chi phí chia cho số nhân sự tuyển'],
    ['Phí đăng tin tuyển dụng (Job Posting Fees)', kpi.totalPostingFees, 'VNĐ', `${kpi.postingFeePercentage}% tổng chi phí`],
    ['Thưởng giới thiệu nội bộ (Referral Bonuses)', kpi.totalReferralBonuses, 'VNĐ', `${kpi.referralBonusPercentage}% tổng chi phí`],
    [''],
    ['2. PHÂN TÍCH THỜI GIAN THEO TỪNG GIAI ĐOẠN TRONG PIPELINE'],
    ['Giai đoạn', 'Số ngày thực tế', 'Số ngày chuẩn (Benchmark)', 'Trạng thái', 'Mô tả chi tiết'],
  ];

  pipelineStages.forEach((stage) => {
    sheet1Data.push([
      stage.stageLabel,
      stage.avgDays,
      stage.benchmarkDays,
      stage.status === 'EXCELLENT' ? 'Xuất sắc' : stage.status === 'GOOD' ? 'Đạt chuẩn' : 'Cần tối ưu',
      stage.description,
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Tong_Quan_KPI');

  // =========================================================================
  // SHEET 2: SO SÁNH THEO PHÒNG BAN (DEPARTMENT COMPARISON)
  // =========================================================================
  const sheet2Data: Array<Array<string | number>> = [
    ['BẢNG SO SÁNH THỜI GIAN & CHI PHÍ THEO KHỐI / PHÒNG BAN'],
    [''],
    [
      'STT',
      'Tên Phòng Ban / Khối',
      'Đã tuyển (Hires)',
      'Chỉ tiêu (Target)',
      'Tỷ lệ đạt (%)',
      'Time-to-hire (Ngày)',
      'Phí đăng tin (VNĐ)',
      'Thưởng giới thiệu (VNĐ)',
      'Tổng chi phí (VNĐ)',
      'Cost-per-hire (VNĐ)',
      'Đánh giá hiệu quả',
    ],
  ];

  const targetDepts =
    filters?.departmentId && filters.departmentId !== 'ALL'
      ? departments.filter((d) => d.departmentId === filters.departmentId)
      : departments;

  targetDepts.forEach((dept, index) => {
    const rate = dept.targetCount > 0 ? Math.round((dept.hiredCount / dept.targetCount) * 100) : 0;
    sheet2Data.push([
      index + 1,
      dept.departmentName,
      dept.hiredCount,
      dept.targetCount,
      `${rate}%`,
      dept.avgTimeToHireDays,
      dept.totalPostingFees,
      dept.totalReferralBonuses,
      dept.totalCost,
      Math.round(dept.costPerHire),
      dept.efficiencyRating === 'CAO' ? 'Hiệu quả cao' : dept.efficiencyRating === 'TRUNG_BINH' ? 'Trung bình' : 'Cần tối ưu',
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'Theo_Phong_Ban');

  // =========================================================================
  // SHEET 3: CHI TIẾT THEO CHỨC DANH / VỊ TRÍ CÔNG VIỆC
  // =========================================================================
  const sheet3Data: Array<Array<string | number>> = [
    ['BẢNG CHI TIẾT HIỆU QUẢ THEO TỪNG VỊ TRÍ TUYỂN DỤNG'],
    [''],
    [
      'STT',
      'Chức danh tuyển dụng',
      'Đơn vị trực thuộc',
      'Số lượng tuyển',
      'Time-to-hire (Ngày)',
      'Phí đăng tin (VNĐ)',
      'Thưởng giới thiệu (VNĐ)',
      'Tổng chi phí (VNĐ)',
      'Cost-per-hire (VNĐ)',
      'Mức độ phức tạp',
    ],
  ];

  const targetPositions = positions.filter((pos) => {
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      const matchDept = departments.find((d) => d.departmentId === filters.departmentId);
      if (matchDept && pos.departmentName !== matchDept.departmentName) {
        return false;
      }
    }
    if (filters?.jobTitleId && filters.jobTitleId !== 'ALL') {
      if (pos.jobId !== filters.jobTitleId) {
        return false;
      }
    }
    return true;
  });

  targetPositions.forEach((pos, index) => {
    sheet3Data.push([
      index + 1,
      pos.jobTitle,
      pos.departmentName,
      pos.hiredCount,
      pos.avgTimeToHireDays,
      pos.postingFees,
      pos.referralBonuses,
      pos.totalCost,
      Math.round(pos.costPerHire),
      pos.difficultyLevel,
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'Theo_Chuc_Danh');

  return wb;
};

/**
 * Xuất dữ liệu báo cáo Thời gian & Chi phí tuyển dụng ra tệp Excel (.xlsx) đa bảng tính
 */
export const exportTimeCostReportToExcel = (
  reportData: TimeCostReportData,
  filters?: TimeCostReportFilterState,
): boolean => {
  try {
    const wb = createTimeCostReportWorkbook(reportData, filters);
    const filename = generateTimeCostReportFilename();
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file Excel báo cáo thời gian chi phí:', error);
    return false;
  }
};

