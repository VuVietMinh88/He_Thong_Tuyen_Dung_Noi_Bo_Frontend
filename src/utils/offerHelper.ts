/**
 * Helper tiện ích tính toán và kiểm tra dải lương chuẩn cho biểu mẫu soạn đề nghị tuyển dụng
 * Jira Subtask: TKNHTTDNB1-491 - Thiết kế biểu mẫu soạn đề nghị tuyển dụng (Story TKNHTTDNB1-71)
 */

import { z } from 'zod/v3';
import {
  offerFormSchema,
  type OfferFormValues,
  type StandardSalaryRange,
  type SalaryComparisonResult,
  type JobPositionOption,
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
 * Base schema cho biểu mẫu đề nghị tuyển dụng khớp 100% với OfferFormValues
 */
export const offerFormBaseSchema = offerFormSchema;
export type OfferFormSchemaType = OfferFormValues;

/**
 * Xây dựng Zod validation schema động cho biểu mẫu đề nghị tuyển dụng
 * Khi isSalaryOutOfRange = true, trường outOfRangeReason được chuyển thành bắt buộc
 */
export const createOfferFormValidationSchema = (isSalaryOutOfRange: boolean) => {
  return offerFormBaseSchema.superRefine((formDataValues, refinementContext) => {
    // 1. Kiểm tra lý do vượt khung khi lương ngoài dải chuẩn
    if (isSalaryOutOfRange) {
      const trimmedReason = formDataValues.outOfRangeReason?.trim() || '';
      if (trimmedReason.length < 10) {
        refinementContext.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outOfRangeReason'],
          message:
            'Mức lương nằm ngoài dải chuẩn. Vui lòng nhập lý do giải trình chi tiết (tối thiểu 10 ký tự).',
        });
      }
    }

    // 2. Logic kiểm tra tính hợp lệ về mốc thời gian: Hạn phản hồi không được muộn hơn ngày nhận việc
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

/**
 * Định dạng chuỗi ngày YYYY-MM-DD sang định dạng ngày Việt Nam DD/MM/YYYY
 */
export const formatDateVietnamese = (dateString?: string): string => {
  if (!dateString) return 'Chưa xác định';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

/**
 * Chuyển đổi số tiền VNĐ thành văn bản đọc bằng chữ cơ bản
 */
export const formatVndWords = (amountNumber?: number): string => {
  if (!amountNumber || amountNumber <= 0 || Number.isNaN(amountNumber)) {
    return 'Không đồng';
  }

  // Đọc các mốc thông dụng trong hợp đồng tuyển dụng
  const billions = Math.floor(amountNumber / 1000000000);
  const remainderAfterBillions = amountNumber % 1000000000;
  const millions = Math.floor(remainderAfterBillions / 1000000);
  const remainderAfterMillions = remainderAfterBillions % 1000000;
  const thousands = Math.floor(remainderAfterMillions / 1000);

  const textSegments: string[] = [];

  if (billions > 0) {
    textSegments.push(`${billions} tỷ`);
  }
  if (millions > 0) {
    textSegments.push(`${millions} triệu`);
  }
  if (thousands > 0) {
    textSegments.push(`${thousands} nghìn`);
  }

  if (textSegments.length === 0) {
    return `${amountNumber.toLocaleString('vi-VN')} đồng chẵn`;
  }

  return `${textSegments.join(' ')} đồng chẵn`;
};

/**
 * Tạo dữ liệu đầy đủ cho bản xem trước Thư mời nhận việc (Offer Letter Preview)
 */
export const generateOfferPreviewContent = (
  formValues: import('../types/offer').OfferFormValues,
  candidateDetails: {
    candidateName?: string;
    candidateCode?: string;
    candidateEmail?: string;
    candidatePhoneNumber?: string;
  },
  positionOption?: import('../types/offer').JobPositionOption
): import('../types/offer').OfferPreviewContent => {
  const currentTimestamp = new Date();
  const dateFormatted = `${currentTimestamp.getDate().toString().padStart(2, '0')}/${(
    currentTimestamp.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}/${currentTimestamp.getFullYear()}`;

  const offeredSalary = Number(formValues.offeredSalary) || 0;
  const allowanceAmount = Number(formValues.allowanceAmount) || 0;
  const totalMonthlyCompensation = offeredSalary + allowanceAmount;

  const standardSalaryRange = positionOption?.standardSalaryRange;
  const isSalaryOutOfRange = standardSalaryRange
    ? offeredSalary < standardSalaryRange.minimumSalary ||
      offeredSalary > standardSalaryRange.maximumSalary
    : false;

  const standardSalaryRangeFormatted = standardSalaryRange
    ? `${formatVndCurrency(standardSalaryRange.minimumSalary)} – ${formatVndCurrency(
        standardSalaryRange.maximumSalary
      )}`
    : 'Chưa có dải lương chuẩn';

  const candidateName = candidateDetails.candidateName || 'Ứng viên tiềm năng';

  return {
    letterTitle: 'THƯ MỜI NHẬN VIỆC (JOB OFFER LETTER)',
    letterReferenceNumber: `OFF-${currentTimestamp.getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`,
    issuedDateFormatted: dateFormatted,
    companyName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ TTCS & HỆ THỐNG TUYỂN DỤNG NỘI BỘ',
    companyAddress: 'Tầng 12, Tòa nhà Công Nghệ Cao, Quận Cầu Giấy, Hà Nội, Việt Nam',
    candidateName,
    candidateCode: candidateDetails.candidateCode,
    candidateEmail: candidateDetails.candidateEmail || 'chua-co-email@example.com',
    candidatePhoneNumber: candidateDetails.candidatePhoneNumber || 'Chưa cập nhật',
    jobTitle: formValues.jobTitle || positionOption?.positionTitle || 'Chức danh chưa đặt',
    jobLevel: positionOption?.jobLevel || 'Chuyên viên',
    departmentName: positionOption?.departmentName || 'Khối Kỹ Thuật & Công Nghệ',
    offeredSalaryFormatted: formatVndCurrency(offeredSalary),
    offeredSalaryInWords: formatVndWords(offeredSalary),
    allowanceAmountFormatted: formatVndCurrency(allowanceAmount),
    allowanceDescription:
      formValues.allowanceDescription || 'Phụ cấp ăn trưa và gửi xe theo chính sách công ty',
    totalMonthlyCompensationFormatted: formatVndCurrency(totalMonthlyCompensation),
    standardSalaryRangeFormatted,
    isSalaryOutOfRange,
    outOfRangeReason: formValues.outOfRangeReason,
    expectedStartDateFormatted: formatDateVietnamese(formValues.expectedStartDate),
    responseDeadlineFormatted: formatDateVietnamese(formValues.responseDeadline),
    additionalNotes: formValues.additionalNotes,
  };
};

/**
 * Tạo một bản ghi OfferRecord hoàn chỉnh từ dữ liệu form và thông tin ứng viên
 */
export const createOfferRecordFromValues = (
  candidateId: string,
  candidateName: string,
  candidateCode: string | undefined,
  candidateEmail: string | undefined,
  candidatePhoneNumber: string | undefined,
  formDataValues: import('../types/offer').OfferFormValues,
  isSalaryOutOfRange: boolean,
  salaryComparisonStatus: import('../types/offer').SalaryComparisonStatus,
  status: import('../types/offer').OfferStatus = 'PENDING_APPROVAL'
): import('../types/offer').OfferRecord => {
  const currentTimestamp = new Date().toISOString();
  const offeredSalary = Number(formDataValues.offeredSalary) || 0;
  const allowanceAmount = Number(formDataValues.allowanceAmount) || 0;

  return {
    offerId: `offer-${Date.now()}`,
    offerCode: `OFF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    candidateId,
    candidateName,
    candidateCode,
    candidateEmail,
    candidatePhoneNumber,
    jobTitle: formDataValues.jobTitle,
    positionId: formDataValues.positionId,
    offeredSalary,
    allowanceAmount,
    allowanceDescription: formDataValues.allowanceDescription || '',
    totalMonthlyCompensation: offeredSalary + allowanceAmount,
    expectedStartDate: formDataValues.expectedStartDate,
    responseDeadline: formDataValues.responseDeadline,
    outOfRangeReason: formDataValues.outOfRangeReason || '',
    isSalaryOutOfRange,
    salaryComparisonStatus,
    status,
    additionalNotes: formDataValues.additionalNotes || '',
    sendEmailToCandidate: formDataValues.sendEmailToCandidate ?? true,
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
  };
};


