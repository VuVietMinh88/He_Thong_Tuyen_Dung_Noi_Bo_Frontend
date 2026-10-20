import axios from 'axios';
import client from '../utils/axiosClient';
import type { CriterionEvaluationRecord, InterviewConclusion } from '../types/interviewEvaluation';

export type EvaluationConclusion = 'HIRE' | 'CONSIDER' | 'NO_HIRE';
export interface EvaluationView {
  id: string; interviewId: string; applicationId: string; evaluatorId: string;
  framework: { id: string; code: string; name: string };
  status: 'DRAFT' | 'SUBMITTED'; version: number;
  items: Array<{ criterionId: string; name: string; description: string | null; weight: number;
    sortOrder: number; score: number | null; comment: string | null }>;
  conclusion: EvaluationConclusion | null; totalScore: number | null;
  firstSubmittedAt: string | null; submittedAt: string | null; updatedAt: string;
}
export interface EvaluationStatus {
  id: string; interviewId: string; status: 'DRAFT' | 'SUBMITTED'; version: number;
  firstSubmittedAt: string | null; updatedAt: string;
}
export const toApiConclusion = (value?: InterviewConclusion | null): EvaluationConclusion | null =>
  value ? ({ RECOMMENDED: 'HIRE', CONSIDER: 'CONSIDER', NOT_RECOMMENDED: 'NO_HIRE' } as const)[value] : null;
export const fromApiConclusion = (value: EvaluationConclusion | null): InterviewConclusion | null =>
  value ? ({ HIRE: 'RECOMMENDED', CONSIDER: 'CONSIDER', NO_HIRE: 'NOT_RECOMMENDED' } as const)[value] : null;
export const isVersionConflict = (error: unknown): boolean => axios.isAxiosError(error) && error.response?.status === 409;
export const evaluationError = (error: unknown): string => {
  if (isVersionConflict(error)) return 'Phiếu đã thay đổi hoặc không còn cho phép thao tác. Tải lại dữ liệu trước khi tiếp tục; bản chỉnh sửa chưa được gửi lại.';
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác với phiếu này.';
    if (error.response?.status === 401) return 'Phiên đăng nhập đã hết hạn.';
    const message = error.response?.data?.message;
    return typeof message === 'string' ? message : 'Không thể lưu hoặc tải phiếu đánh giá từ máy chủ.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý phiếu đánh giá.';
};
function ownPath(id: string): string { return `/interviews/${encodeURIComponent(id)}/evaluations/me`; }
function checked(value: EvaluationView, interviewId: string): EvaluationView {
  if (!value || value.interviewId !== interviewId || !value.id || !Number.isSafeInteger(value.version)
      || value.version < 0 || !['DRAFT', 'SUBMITTED'].includes(value.status)
      || !value.framework || !Array.isArray(value.items)
      || value.items.some(item => !item.criterionId || !Number.isFinite(item.weight))) {
    throw new Error('Response phiếu đánh giá không đúng contract Backend.');
  }
  return value;
}
export const evaluationApi = {
  async get(interviewId: string): Promise<EvaluationView> {
    return checked((await client.get<EvaluationView>(ownPath(interviewId))).data, interviewId);
  },
  async create(interviewId: string): Promise<EvaluationView> {
    return checked((await client.post<EvaluationView>(ownPath(interviewId))).data, interviewId);
  },
  async save(form: EvaluationView, records: Record<string, CriterionEvaluationRecord>, conclusion: InterviewConclusion | null, submit: boolean): Promise<EvaluationView> {
    const body = { expectedVersion: form.version,
      items: form.items.map(item => ({ criterionId: item.criterionId,
        score: records[item.criterionId]?.score ?? null, comment: records[item.criterionId]?.comment ?? '' })),
      conclusion: toApiConclusion(conclusion) };
    const response = submit
      ? await client.post<EvaluationView>(`${ownPath(form.interviewId)}/submit`, body)
      : await client.put<EvaluationView>(ownPath(form.interviewId), body);
    const saved = checked(response.data, form.interviewId);
    if (saved.id !== form.id || (submit && (saved.status !== 'SUBMITTED' || !saved.submittedAt))) {
      throw new Error('Backend chưa xác nhận phiếu đã được nộp thành công.');
    }
    return saved;
  },
  async peers(interviewId: string): Promise<EvaluationView[]> {
    const response = await client.get<EvaluationView[]>(`/interviews/${encodeURIComponent(interviewId)}/evaluations`);
    if (!Array.isArray(response.data)) throw new Error('Response danh sách đánh giá không hợp lệ.');
    return response.data.map(form => checked(form, interviewId));
  },
  async status(interviewId: string, formId: string): Promise<EvaluationStatus> {
    const data = (await client.get<EvaluationStatus>(`/interviews/${encodeURIComponent(interviewId)}/evaluations/${encodeURIComponent(formId)}/status`)).data;
    if (data.id !== formId || data.interviewId !== interviewId || !Number.isSafeInteger(data.version) || data.version < 0
      || !['DRAFT', 'SUBMITTED'].includes(data.status)) throw new Error('Metadata phiếu không hợp lệ.');
    return data;
  },
  async reopen(interviewId: string, formId: string, expectedVersion: number, reason: string): Promise<EvaluationStatus> {
    if (!reason.trim()) throw new Error('Cần nhập lý do mở lại phiếu.');
    const response = await client.post<EvaluationStatus>(`/interviews/${encodeURIComponent(interviewId)}/evaluations/${encodeURIComponent(formId)}/reopen`,
      { expectedVersion, reason: reason.trim() });
    if (response.data.id !== formId || response.data.interviewId !== interviewId || response.data.status !== 'DRAFT') {
      throw new Error('Backend chưa xác nhận mở lại phiếu.');
    }
    return response.data;
  },
};
