/**
 * Recruitment Funnel Service (Jira TKNHTTDNB1-565 - User Story S9-01)
 * Cung cấp logic tính toán phễu tuyển dụng, bộ lọc đa chiều và tổng hợp KPI.
 */

import axiosClient from '../utils/axiosClient';
import type {
  DatePreset,
  FunnelFilterState,
  FunnelFilterOptions,
  FunnelReportData,
  FunnelStageMetric,
  FunnelSummaryKpi,
  DropOffAlertInfo,
  DepartmentOption,
  JobOpeningOption,
  RecruiterOption,
} from '../types/recruitmentFunnel';
import { FUNNEL_STAGE_DEFINITIONS } from '../types/recruitmentFunnel';

export const MOCK_DEPARTMENTS: DepartmentOption[] = [
  { id: 'dept-it', name: 'Khối Công nghệ & Kỹ thuật', code: 'TECH' },
  { id: 'dept-mkt', name: 'Khối Tiếp thị & Tăng trưởng', code: 'MKT' },
  { id: 'dept-sales', name: 'Khối Kinh doanh & Đối tác', code: 'SALES' },
  { id: 'dept-hr', name: 'Khối Nhân sự & Vận hành', code: 'HR' },
  { id: 'dept-fin', name: 'Khối Tài chính & Kế toán', code: 'FIN' },
];

export const MOCK_JOB_OPENINGS: JobOpeningOption[] = [
  { id: 'job-fe-01', title: 'Senior Frontend React Engineer', departmentId: 'dept-it', status: 'OPEN' },
  { id: 'job-be-02', title: 'Senior Backend Golang/Node Engineer', departmentId: 'dept-it', status: 'OPEN' },
  { id: 'job-tl-03', title: 'Technical Lead & Solution Architect', departmentId: 'dept-it', status: 'IN_PROGRESS' },
  { id: 'job-mkt-01', title: 'Growth & Performance Marketing Lead', departmentId: 'dept-mkt', status: 'OPEN' },
  { id: 'job-sales-01', title: 'Enterprise B2B Sales Executive', departmentId: 'dept-sales', status: 'OPEN' },
  { id: 'job-hr-01', title: 'Talent Acquisition Specialist (Tech)', departmentId: 'dept-hr', status: 'OPEN' },
  { id: 'job-fin-01', title: 'Senior Financial & Budget Analyst', departmentId: 'dept-fin', status: 'CLOSED' },
];

export const MOCK_RECRUITERS: RecruiterOption[] = [
  { id: 'rec-01', name: 'Nguyễn Thu Hà', email: 'ha.nguyen@smartrecruit.vn', departmentName: 'Nhân sự' },
  { id: 'rec-02', name: 'Phạm Minh Tuấn', email: 'tuan.pham@smartrecruit.vn', departmentName: 'Nhân sự' },
  { id: 'rec-03', name: 'Lê Hoàng Long', email: 'long.le@smartrecruit.vn', departmentName: 'Nhân sự' },
  { id: 'rec-04', name: 'Đặng Mai Phương', email: 'phuong.dang@smartrecruit.vn', departmentName: 'Nhân sự' },
];

/**
 * Tính toán khoảng ngày tương ứng với bộ chọn DatePreset
 */
export const calculateDateRangeForPreset = (
  preset: DatePreset,
  referenceDateStr = '2026-10-15',
): { startDate: string; endDate: string } => {
  const [refYear, refMonth, refDay] = referenceDateStr.split('-').map(Number);
  const refDate = new Date(refYear, refMonth - 1, refDay);

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  switch (preset) {
    case 'TODAY':
      return {
        startDate: referenceDateStr,
        endDate: referenceDateStr,
      };
    case 'LAST_7_DAYS': {
      const past7 = new Date(refDate);
      past7.setDate(refDate.getDate() - 6);
      return {
        startDate: formatDate(past7),
        endDate: referenceDateStr,
      };
    }
    case 'THIS_MONTH': {
      const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      const endOfMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
      return {
        startDate: formatDate(startOfMonth),
        endDate: formatDate(endOfMonth),
      };
    }
    case 'THIS_QUARTER': {
      const currentMonth = refDate.getMonth(); // 0-11. Tháng 10 là tháng 9 (0-indexed) -> Q4
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const startOfQuarter = new Date(refDate.getFullYear(), quarterStartMonth, 1);
      const endOfQuarter = new Date(refDate.getFullYear(), quarterStartMonth + 3, 0);
      return {
        startDate: formatDate(startOfQuarter),
        endDate: formatDate(endOfQuarter),
      };
    }
    case 'CUSTOM':
    default:
      return {
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      };
  }
};

/**
 * Bộ lọc mặc định khi khởi tạo dashboard
 */
export const getDefaultFunnelFilters = (): FunnelFilterState => {
  const { startDate, endDate } = calculateDateRangeForPreset('THIS_MONTH');
  return {
    datePreset: 'THIS_MONTH',
    startDate,
    endDate,
    departmentId: 'ALL',
    jobOpeningId: 'ALL',
    recruiterId: 'ALL',
  };
};

/**
 * Tính toán chỉ số phễu tuyển dụng từ mảng số lượng
 */
/**
 * Thuật toán phát hiện điểm rơi lớn nhất giữa các vòng tuyển dụng (AC 2)
 * Drop-off Rate = ((Số lượng vòng N - Số lượng vòng N+1) / Số lượng vòng N) * 100%
 */
export const detectBiggestDropOff = (
  stages: FunnelStageMetric[],
): DropOffAlertInfo | null => {
  let maxDropRate = -1;
  let worstStageIndex = -1;
  let maxDropCount = 0;

  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1];
    const curr = stages[i];
    if (prev.count > 0) {
      const dropCount = Math.max(0, prev.count - curr.count);
      const rate = Math.round((dropCount / prev.count) * 1000) / 10;
      if (rate > maxDropRate && dropCount > 0) {
        maxDropRate = rate;
        worstStageIndex = i;
        maxDropCount = dropCount;
      }
    }
  }

  if (worstStageIndex === -1 || maxDropRate <= 0) return null;

  const worstStage = stages[worstStageIndex];
  const prevStage = stages[worstStageIndex - 1];

  let recommendation = '';
  switch (worstStage.id) {
    case 'SCREENED':
      recommendation =
        'Tỷ lệ loại hồ sơ cao tại vòng duyệt CV. Khuyến nghị hiệu chỉnh tiêu chí trong JD hoặc tối ưu kênh tạo nguồn ứng viên.';
      break;
    case 'INTERVIEW_1':
      recommendation =
        'Hao hụt ứng viên lớn tại phỏng vấn sơ loại. Nên chuẩn hóa bộ câu hỏi văn hóa và sàng lọc trước kỳ vọng mức lương.';
      break;
    case 'INTERVIEW_2':
      recommendation =
        'Ứng viên dừng lại nhiều ở vòng phỏng vấn chuyên sâu. Nên gửi trước bài test kỹ thuật và thống nhất thang điểm đánh giá.';
      break;
    case 'OFFERED':
      recommendation =
        'Số ứng viên nhận Offer thấp so với số qua phỏng vấn. Cần rút ngắn thời gian phê duyệt và ra quyết định Offer.';
      break;
    case 'HIRED':
      recommendation =
        'Tỷ lệ từ chối Offer cao. Khuyến nghị rà soát lại tính cạnh tranh của gói thu nhập (C&B) trên thị trường.';
      break;
    default:
      recommendation = 'Theo dõi sát sao lưu lượng ứng viên và cải thiện quy trình chuyển giao giữa các vòng.';
  }

  return {
    stageId: worstStage.id,
    stageName: worstStage.name,
    stageOrder: worstStage.stageOrder,
    dropRate: maxDropRate,
    dropCount: maxDropCount,
    incomingCount: prevStage.count,
    passedCount: worstStage.count,
    alertMessage: `Điểm rơi lớn nhất: ${maxDropRate}% ứng viên dừng lại tại vòng [${worstStage.name}]`,
    recommendation,
  };
};

/**
 * Tính toán chỉ số phễu tuyển dụng từ mảng số lượng
 */
export const computeFunnelMetricsFromCounts = (
  rawCounts: [number, number, number, number, number, number],
  avgDays: [number, number, number, number, number, number] = [1.5, 2.5, 4.0, 5.5, 3.2, 5.7],
): { stages: FunnelStageMetric[]; kpi: FunnelSummaryKpi; biggestDropOff: DropOffAlertInfo | null } => {
  const isAllZero = rawCounts.every((c) => c === 0);
  const appliedCount = isAllZero ? 0 : Math.max(rawCounts[0], 1);
  const hiredCount = rawCounts[5];

  const initialStages: FunnelStageMetric[] = FUNNEL_STAGE_DEFINITIONS.map((def, index) => {
    const currentCount = rawCounts[index];
    const prevCount = index === 0 ? currentCount : rawCounts[index - 1];

    // Pass rate: Tỷ lệ % vượt qua vòng so với vòng trước
    const passRate =
      index === 0
        ? (currentCount > 0 ? 100 : 0)
        : prevCount > 0
          ? Math.round((currentCount / prevCount) * 1000) / 10
          : 0;

    // Retention rate: Tỷ lệ % giữ chân so với tổng số tiếp nhận ban đầu
    const retentionRate =
      appliedCount > 0 ? Math.round((currentCount / appliedCount) * 1000) / 10 : 0;

    // Drop count & rate
    const dropCount = index === 0 ? 0 : Math.max(0, prevCount - currentCount);
    const dropRate =
      index === 0
        ? 0
        : prevCount > 0
          ? Math.round((dropCount / prevCount) * 1000) / 10
          : 0;

    return {
      id: def.id,
      name: def.name,
      stageOrder: def.stageOrder,
      description: def.description,
      count: currentCount,
      passRate,
      retentionRate,
      dropCount,
      dropRate,
      avgDaysInStage: avgDays[index],
      colorClass: def.colorClass,
      badgeBgClass: def.badgeBgClass,
    };
  });

  const biggestDropOff = detectBiggestDropOff(initialStages);

  const stages = initialStages.map((st) => ({
    ...st,
    isBiggestDropOff: Boolean(biggestDropOff && st.id === biggestDropOff.stageId),
  }));

  // KPI Calculations
  const overallConversionRate =
    appliedCount > 0 ? Math.round((hiredCount / appliedCount) * 1000) / 10 : 0;

  const totalTimeToHire = isAllZero
    ? 0
    : Math.round(avgDays.reduce((acc, curr) => acc + curr, 0) * 10) / 10;

  const screeningPassRate = stages[1]?.passRate ?? 0;
  const offeredCount = rawCounts[4];
  const offerAcceptanceRate =
    offeredCount > 0 ? Math.round((hiredCount / offeredCount) * 1000) / 10 : 0;

  const kpi: FunnelSummaryKpi = {
    totalApplications: appliedCount,
    overallConversionRate,
    avgTimeToHireDays: totalTimeToHire,
    totalHired: hiredCount,
    screeningPassRate,
    offerAcceptanceRate,
    applicationsGrowthPercent: isAllZero ? 0 : 12.8,
    conversionRateChangePercent: isAllZero ? 0 : 0.6,
    timeToHireChangeDays: isAllZero ? 0 : -2.3,
  };

  return { stages, kpi, biggestDropOff };
};

/**
 * Service xử lý báo cáo phễu tuyển dụng
 */
export const recruitmentFunnelService = {
  /**
   * Lấy danh sách options cho các bộ lọc
   */
  async getFilterOptions(): Promise<FunnelFilterOptions> {
    return {
      departments: MOCK_DEPARTMENTS,
      jobOpenings: MOCK_JOB_OPENINGS,
      recruiters: MOCK_RECRUITERS,
    };
  },

  /**
   * Kết nối API backend theo bộ lọc với fallback phân tích (AC 3)
   */
  async getFunnelReportData(filters: FunnelFilterState): Promise<FunnelReportData> {
    try {
      const response = await axiosClient.get('/recruitment/reports/funnel', {
        params: {
          preset: filters.datePreset,
          startDate: filters.startDate,
          endDate: filters.endDate,
          departmentId: filters.departmentId !== 'ALL' ? filters.departmentId : undefined,
          jobOpeningId: filters.jobOpeningId !== 'ALL' ? filters.jobOpeningId : undefined,
          recruiterId: filters.recruiterId !== 'ALL' ? filters.recruiterId : undefined,
        },
      });
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch {
      // Backend offline hoặc chưa có API -> fallback dữ liệu phân tích
    }
    return recruitmentFunnelService.getFunnelReport(filters);
  },

  /**
   * Truy vấn dữ liệu báo cáo phễu tuyển dụng theo bộ lọc (Mô phỏng & phân tích)
   */
  async getFunnelReport(filters: FunnelFilterState): Promise<FunnelReportData> {
    // Trường hợp kiểm tra Empty State (ví dụ lọc phòng ban không tồn tại)
    if (filters.departmentId === 'EMPTY_TEST') {
      const { stages, kpi, biggestDropOff } = computeFunnelMetricsFromCounts([0, 0, 0, 0, 0, 0]);
      return {
        filters,
        kpi,
        stages,
        biggestDropOff,
        updatedAt: new Date().toISOString(),
      };
    }

    // Mô phỏng trọng số dữ liệu dựa trên bộ lọc đã chọn
    let baseApplied = 480;
    let baseScreened = 216;
    let baseInt1 = 108;
    let baseInt2 = 48;
    let baseOffered = 28;
    let baseHired = 24;

    // Điều chỉnh theo khoảng thời gian
    if (filters.datePreset === 'TODAY') {
      baseApplied = 18;
      baseScreened = 9;
      baseInt1 = 4;
      baseInt2 = 2;
      baseOffered = 1;
      baseHired = 1;
    } else if (filters.datePreset === 'LAST_7_DAYS') {
      baseApplied = 120;
      baseScreened = 58;
      baseInt1 = 28;
      baseInt2 = 14;
      baseOffered = 8;
      baseHired = 7;
    } else if (filters.datePreset === 'THIS_QUARTER') {
      baseApplied = 1420;
      baseScreened = 640;
      baseInt1 = 310;
      baseInt2 = 145;
      baseOffered = 82;
      baseHired = 71;
    }

    // Điều chỉnh theo phòng ban
    if (filters.departmentId !== 'ALL') {
      let deptScale = 0.45;
      if (filters.departmentId === 'dept-it') deptScale = 0.5;
      else if (filters.departmentId === 'dept-mkt') deptScale = 0.2;
      else if (filters.departmentId === 'dept-sales') deptScale = 0.18;
      else if (filters.departmentId === 'dept-hr') deptScale = 0.08;
      else if (filters.departmentId === 'dept-fin') deptScale = 0.04;

      baseApplied = Math.max(12, Math.round(baseApplied * deptScale));
      baseScreened = Math.max(6, Math.round(baseScreened * deptScale));
      baseInt1 = Math.max(3, Math.round(baseInt1 * deptScale));
      baseInt2 = Math.max(2, Math.round(baseInt2 * deptScale));
      baseOffered = Math.max(1, Math.round(baseOffered * deptScale));
      baseHired = Math.max(1, Math.round(baseHired * deptScale));
    }

    // Điều chỉnh theo vị trí tuyển dụng
    if (filters.jobOpeningId !== 'ALL') {
      baseApplied = Math.max(15, Math.round(baseApplied * 0.35));
      baseScreened = Math.max(8, Math.round(baseScreened * 0.35));
      baseInt1 = Math.max(4, Math.round(baseInt1 * 0.35));
      baseInt2 = Math.max(2, Math.round(baseInt2 * 0.35));
      baseOffered = Math.max(1, Math.round(baseOffered * 0.35));
      baseHired = Math.max(1, Math.round(baseHired * 0.35));
    }

    // Điều chỉnh theo Recruiter
    if (filters.recruiterId !== 'ALL') {
      baseApplied = Math.max(20, Math.round(baseApplied * 0.3));
      baseScreened = Math.max(10, Math.round(baseScreened * 0.3));
      baseInt1 = Math.max(5, Math.round(baseInt1 * 0.3));
      baseInt2 = Math.max(3, Math.round(baseInt2 * 0.3));
      baseOffered = Math.max(1, Math.round(baseOffered * 0.3));
      baseHired = Math.max(1, Math.round(baseHired * 0.3));
    }

    // Đảm bảo tính phễu giảm dần hợp logic
    const applied = baseApplied;
    const screened = Math.min(applied, baseScreened);
    const int1 = Math.min(screened, baseInt1);
    const int2 = Math.min(int1, baseInt2);
    const offered = Math.min(int2, baseOffered);
    const hired = Math.min(offered, baseHired);

    const { stages, kpi, biggestDropOff } = computeFunnelMetricsFromCounts([
      applied,
      screened,
      int1,
      int2,
      offered,
      hired,
    ]);

    return {
      filters,
      kpi,
      stages,
      biggestDropOff,
      updatedAt: new Date().toISOString(),
    };
  },
};
