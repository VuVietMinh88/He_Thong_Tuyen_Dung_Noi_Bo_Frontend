/**
 * Recruitment Funnel Service (Jira TKNHTTDNB1-565 - User Story S9-01)
 * Cung cấp logic tính toán phễu tuyển dụng, bộ lọc đa chiều và tổng hợp KPI.
 */

import type {
  DatePreset,
  FunnelFilterState,
  FunnelFilterOptions,
  FunnelReportData,
  FunnelStageMetric,
  FunnelSummaryKpi,
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
export const computeFunnelMetricsFromCounts = (
  rawCounts: [number, number, number, number, number, number],
  avgDays: [number, number, number, number, number, number] = [1.5, 2.5, 4.0, 5.5, 3.2, 5.7],
): { stages: FunnelStageMetric[]; kpi: FunnelSummaryKpi } => {
  const appliedCount = Math.max(rawCounts[0], 1);
  const hiredCount = rawCounts[5];

  const stages: FunnelStageMetric[] = FUNNEL_STAGE_DEFINITIONS.map((def, index) => {
    const currentCount = rawCounts[index];
    const prevCount = index === 0 ? currentCount : rawCounts[index - 1];

    // Pass rate: Tỷ lệ % vượt qua vòng so với vòng trước
    const passRate =
      index === 0
        ? 100
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

  // KPI Calculations
  const overallConversionRate =
    appliedCount > 0 ? Math.round((hiredCount / appliedCount) * 1000) / 10 : 0;

  const totalTimeToHire = Math.round(
    avgDays.reduce((acc, curr) => acc + curr, 0) * 10,
  ) / 10;

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
    applicationsGrowthPercent: 12.8,
    conversionRateChangePercent: 0.6,
    timeToHireChangeDays: -2.3,
  };

  return { stages, kpi };
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
   * Truy vấn dữ liệu báo cáo phễu tuyển dụng theo bộ lọc
   */
  async getFunnelReport(filters: FunnelFilterState): Promise<FunnelReportData> {
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

    const { stages, kpi } = computeFunnelMetricsFromCounts([
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
      updatedAt: new Date().toISOString(),
    };
  },
};
