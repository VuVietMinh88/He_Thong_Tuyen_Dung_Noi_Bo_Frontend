import axios from 'axios';
import type { CandidateProfile } from '../types/candidate';
import { tokenService } from './token.service';
import { businessService, type Requisition } from './business.service';
import { jobPostingService, type JobPostingData } from './jobPostingService';
import {
  buildDepartmentPositionProgress,
  collectDepartmentRequisitions,
  type DepartmentPositionProgressRow,
} from '../utils/departmentPositionProgressHelper';
import axiosClient from '../utils/axiosClient';

const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const responseData: unknown = error.response?.data;
    if (
      typeof responseData === 'object'
      && responseData !== null
      && 'message' in responseData
      && typeof responseData.message === 'string'
    ) {
      return responseData.message;
    }
    if (!error.response) {
      return 'Không thể kết nối Backend. Hãy kiểm tra server và mạng.';
    }
  }
  return error instanceof Error
    ? error.message
    : 'Không thể tải tiến độ tuyển dụng của phòng ban.';
};

export const positionService = {
  async getPositionsByDepartment(): Promise<DepartmentPositionProgressRow[]> {
    const user = tokenService.getUserData();
    if (!user) {
      throw new Error('Không xác định được tài khoản hiện tại. Vui lòng đăng nhập lại.');
    }
    if (!user.roles.includes('HIRING_MANAGER')) {
      throw new Error('Chỉ Trưởng bộ phận mới có quyền xem tiến độ vị trí phòng ban.');
    }
    const departmentId = user.departmentId?.trim();
    if (!departmentId) {
      throw new Error('Tài khoản chưa được gán phòng ban. Vui lòng liên hệ quản trị viên.');
    }

    try {
      const [requisitions, postings, candidates]: [
        Requisition[],
        JobPostingData[],
        CandidateProfile[],
      ] = await Promise.all([
        collectDepartmentRequisitions((page) =>
          businessService.getRequisitions({
            departmentId,
            page,
            size: 100,
          }),
        ),
        jobPostingService.getManageableJobPostings(),
        this.getCandidatesFromApi(),
      ]);

      return buildDepartmentPositionProgress(
        requisitions.filter((requisition) => requisition.departmentId === departmentId),
        postings,
        candidates,
        departmentId,
      );
    } catch (error) {
      throw new Error(getApiErrorMessage(error), { cause: error });
    }
  },

  async getCandidatesFromApi(): Promise<CandidateProfile[]> {
    const response = await axiosClient.get<CandidateProfile[]>('/recruitment/candidates');
    if (!Array.isArray(response.data)) {
      throw new Error('Định dạng danh sách ứng viên từ Backend không hợp lệ.');
    }
    return response.data;
  },
};
