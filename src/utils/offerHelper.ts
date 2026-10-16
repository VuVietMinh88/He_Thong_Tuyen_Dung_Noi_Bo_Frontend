/**
 * Helper tiện ích tính toán và kiểm tra dải lương chuẩn cho biểu mẫu soạn đề nghị tuyển dụng
 * Jira Subtask: TKNHTTDNB1-491 - Thiết kế biểu mẫu soạn đề nghị tuyển dụng (Story TKNHTTDNB1-71)
 */

import { z } from 'zod';
import type {
  StandardSalaryRange,
  SalaryComparisonResult,
  JobPositionOption,
} from '../types/offer';

/**
 * Danh sách vị trí mẫu có dải lương chuẩn được phê duyệt từ ban giám đốc
 * Dùng làm dữ liệu mặc định khi người dùng chưa chọn chức danh cụ thể
 */
export const DEFAULT_STANDARD_POSITIONS: JobPositionOption[] = [
  {
    positionId: 'pos-fe-senior',
    positionCode: 'POS-FE-SR',
    positionTitle: 'Senior Frontend Developer (React, TypeScript)',
    departmentName: 'Phòng Phát triển Phần mềm (IT)',
    jobLevel: 'Senior',
    standardSalaryRange: {
      minimumSalary: 28000000,
      maximumSalary: 42000000,
      currencyCode: 'VND',
    },
    isActive: true,
  },
  {
    positionId: 'pos-fe-mid',
    positionCode: 'POS-FE-MD',
    positionTitle: 'Middle Frontend Developer',
    departmentName: 'Phòng Phát triển Phần mềm (IT)',
    jobLevel: 'Middle',
    standardSalaryRange: {
      minimumSalary: 16000000,
      maximumSalary: 26000000,
      currencyCode: 'VND',
    },
    isActive: true,
  },
  {
    positionId: 'pos-be-senior',
    positionCode: 'POS-BE-SR',
    positionTitle: 'Senior Backend Engineer (Java Spring Boot)',
    departmentName: 'Phòng Phát triển Phần mềm (IT)',
    jobLevel: 'Senior',
    standardSalaryRange: {
      minimumSalary: 30000000,
      maximumSalary: 48000000,
      currencyCode: 'VND',
    },
    isActive: true,
  },
  {
    positionId: 'pos-qa-lead',
    positionCode: 'POS-QA-LD',
    positionTitle: 'QA Automation Lead',
    departmentName: 'Phòng Đảm bảo Chất lượng (QA)',
    jobLevel: 'Lead',
    standardSalaryRange: {
      minimumSalary: 25000000,
      maximumSalary: 38000000,
      currencyCode: 'VND',
    },
    isActive: true,
  },
  {
    positionId: 'pos-product-manager',
    positionCode: 'POS-PM',
    positionTitle: 'Product Manager (Quản trị sản phẩm)',
    departmentName: 'Khối Kế hoạch & Sản phẩm',
    jobLevel: 'Manager',
    standardSalaryRange: {
      minimumSalary: 35000000,
      maximumSalary: 55000000,
      currencyCode: 'VND',
    },
    isActive: true,
  },
  {
    positionId: 'pos-recruiter-specialist',
    positionCode: 'POS-HR-REC',
    positionTitle: 'Chuyên viên Tuyển dụng Nhân sự',
    departmentName: 'Phòng Nhân sự & Đào tạo',
    jobLevel: 'Middle',
    standardSalaryRange: {
      minimumSalary: 14000000,
      maximumSalary: 22000000,
      currencyCode: 'VND',
    },
    isActive: true,
  },
];

/**
 * Định dạng số tiền sang định dạng tiền tệ VNĐ dễ nhìn (VD: 35.000.000 ₫)
 */
export const formatVndCurrency = (amountNumber?: number): string => {
  if (
    amountNumber === undefined ||
    amountNumber === null ||
    Number.isNaN(amountNumber)
  ) {
    return '0 ₫';
  }
  return `${amountNumber.toLocaleString('vi-VN')} ₫`;
};

/**
 * Tạo ngày mặc định dạng chuỗi YYYY-MM-DD cách ngày hiện tại một số ngày nhất định
 */
export const calculateDefaultFutureDate = (daysAhead: number): string => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  return targetDate.toISOString().split('T')[0];
};

/**
 * Tính tổng đãi ngộ hàng tháng dự kiến (Mức lương cơ bản + Mức phụ cấp)
 */
export const calculateTotalMonthlyPackage = (
  baseSalary: number,
  allowanceAmount: number
): number => {
  const safeBaseSalary = Number.isNaN(baseSalary) ? 0 : baseSalary;
  const safeAllowanceAmount = Number.isNaN(allowanceAmount) ? 0 : allowanceAmount;
  return safeBaseSalary + safeAllowanceAmount;
};

/**
 * Đối chiếu mức lương đề xuất với dải lương chuẩn của vị trí
 * Trả về chi tiết trạng thái, cảnh báo và số tiền/tỷ lệ chênh lệch
 */
export const evaluateSalaryAgainstRange = (
  proposedSalary: number,
  standardSalaryRange?: StandardSalaryRange | null
): SalaryComparisonResult => {
  if (!standardSalaryRange) {
    return {
      comparisonStatus: 'UNKNOWN',
      isSalaryOutOfRange: false,
      alertMessage: 'Chưa có thông tin dải lương chuẩn cho vị trí đã chọn.',
      differenceAmount: 0,
      differencePercentage: 0,
      formattedMinimumSalary: 'Chưa xác định',
      formattedMaximumSalary: 'Chưa xác định',
    };
  }

  const { minimumSalary, maximumSalary } = standardSalaryRange;
  const formattedMinimumSalary = formatVndCurrency(minimumSalary);
  const formattedMaximumSalary = formatVndCurrency(maximumSalary);

  if (Number.isNaN(proposedSalary) || proposedSalary <= 0) {
    return {
      comparisonStatus: 'UNKNOWN',
      isSalaryOutOfRange: false,
      alertMessage: 'Vui lòng nhập mức lương đề xuất để kiểm tra dải lương chuẩn.',
      differenceAmount: 0,
      differencePercentage: 0,
      formattedMinimumSalary,
      formattedMaximumSalary,
    };
  }

  // Trường hợp 1: Mức lương vượt mức tối đa của dải chuẩn
  if (proposedSalary > maximumSalary) {
    const excessAmount = proposedSalary - maximumSalary;
    // Tính phần trăm vượt so với mức tối đa để phục vụ phân loại cấp phê duyệt
    const excessPercentage = Math.round((excessAmount / maximumSalary) * 100);

    return {
      comparisonStatus: 'ABOVE',
      isSalaryOutOfRange: true,
      alertMessage: `Mức lương đề xuất (${formatVndCurrency(proposedSalary)}) cao hơn ${formatVndCurrency(excessAmount)} (+${excessPercentage}%) so với mức trần quy định (${formattedMaximumSalary}). Bắt buộc nhập lý do vượt khung để trình phê duyệt ngoại lệ.`,
      differenceAmount: excessAmount,
      differencePercentage: excessPercentage,
      formattedMinimumSalary,
      formattedMaximumSalary,
    };
  }

  // Trường hợp 2: Mức lương thấp hơn mức sàn của dải chuẩn
  if (proposedSalary < minimumSalary) {
    const deficitAmount = minimumSalary - proposedSalary;
    // Tính phần trăm thấp hơn so với mức tối thiểu
    const deficitPercentage = Math.round((deficitAmount / minimumSalary) * 100);

    return {
      comparisonStatus: 'BELOW',
      isSalaryOutOfRange: true,
      alertMessage: `Mức lương đề xuất (${formatVndCurrency(proposedSalary)}) thấp hơn ${formatVndCurrency(deficitAmount)} (-${deficitPercentage}%) so với mức sàn quy định (${formattedMinimumSalary}). Bắt buộc nhập lý do điều chỉnh dưới khung.`,
      differenceAmount: -deficitAmount,
      differencePercentage: -deficitPercentage,
      formattedMinimumSalary,
      formattedMaximumSalary,
    };
  }

  // Trường hợp 3: Mức lương nằm hoàn toàn trong dải chuẩn được phê duyệt
  return {
    comparisonStatus: 'WITHIN',
    isSalaryOutOfRange: false,
    alertMessage: `Mức lương đề xuất (${formatVndCurrency(proposedSalary)}) nằm trong dải lương chuẩn được phê duyệt (${formattedMinimumSalary} - ${formattedMaximumSalary}).`,
    differenceAmount: 0,
    differencePercentage: 0,
    formattedMinimumSalary,
    formattedMaximumSalary,
  };
};

/**
 * Xây dựng Zod validation schema động cho biểu mẫu đề nghị tuyển dụng
 * Khi isSalaryOutOfRange = true, trường outOfRangeReason được chuyển thành bắt buộc
 */
export const createOfferFormValidationSchema = (isSalaryOutOfRange: boolean) => {
  return z
    .object({
      jobTitle: z
        .string()
        .trim()
        .min(1, 'Vui lòng chọn hoặc nhập chức danh tuyển dụng.'),
      positionId: z.string().optional(),
      offeredSalary: z.coerce
        .number({
          invalid_type_error: 'Vui lòng nhập mức lương bằng số hợp lệ.',
        })
        .min(1000000, 'Mức lương cơ bản tối thiểu phải từ 1.000.000 ₫ trở lên.'),
      allowanceAmount: z.coerce
        .number({
          invalid_type_error: 'Vui lòng nhập số tiền phụ cấp hợp lệ.',
        })
        .min(0, 'Số tiền phụ cấp không được là số âm.')
        .default(0),
      allowanceDescription: z.string().optional(),
      expectedStartDate: z
        .string()
        .min(1, 'Vui lòng chọn ngày dự kiến nhận việc của ứng viên.'),
      responseDeadline: z
        .string()
        .min(1, 'Vui lòng chọn hạn chót phản hồi đề nghị tuyển dụng.'),
      outOfRangeReason: isSalaryOutOfRange
        ? z
            .string({
              required_error: 'Bắt buộc nhập lý do vượt khung dải lương chuẩn.',
            })
            .trim()
            .min(
              10,
              'Mức lương nằm ngoài dải chuẩn. Vui lòng nhập lý do giải trình chi tiết (tối thiểu 10 ký tự).'
            )
        : z.string().optional(),
      additionalNotes: z.string().optional(),
      sendEmailToCandidate: z.boolean().optional(),
    })
    .superRefine((formDataValues, refinementContext) => {
      // Logic kiểm tra tính hợp lệ về mốc thời gian: Hạn phản hồi không được muộn hơn ngày nhận việc
      if (
        formDataValues.expectedStartDate &&
        formDataValues.responseDeadline
      ) {
        if (
          formDataValues.responseDeadline > formDataValues.expectedStartDate
        ) {
          refinementContext.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['responseDeadline'],
            message:
              'Hạn phản hồi đề nghị phải diễn ra trước hoặc cùng ngày dự kiến nhận việc.',
          });
        }
      }
    });
};
