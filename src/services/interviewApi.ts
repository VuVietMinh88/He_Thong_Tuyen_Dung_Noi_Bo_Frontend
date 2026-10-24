import { requireFeature } from './backendCapabilities';
import client from '../utils/axiosClient';
import type { CreateInterviewSchedulePayload, InterviewSchedulePayload, PersonalScheduleParams } from '../types/interview';

export interface InterviewView {
  id: string; applicationId: string; roundName: string; startsAt: string; endsAt: string;
  mode: 'ONSITE' | 'ONLINE'; room: string | null; meetingUrl: string | null;
  status: 'SCHEDULED' | 'CANCELLED'; version: number; participantIds: string[]; createdAt: string;
}
interface InterviewPage { items: InterviewView[]; totalElements: number; page: number; size: number }
export interface InterviewConflict { interviewId: string; startsAt: string; endsAt: string;
  resourceType: string; participantId: string | null; room: string | null }
export function scheduleRequest(value: CreateInterviewSchedulePayload) {
  return { roundName: value.roundName || value.interviewRound, startsAt: value.startTime,
    durationMinutes: value.durationMinutes, mode: value.interviewType === 'OFFLINE' ? 'ONSITE' : 'ONLINE',
    room: value.interviewType === 'OFFLINE' ? value.locationOrLink : null,
    meetingUrl: value.interviewType === 'ONLINE' ? value.locationOrLink : null,
    participantIds: value.interviewerIds, expectedVersion: value.expectedVersion ?? null,
    overrideConflicts: value.isOverride ?? false, overrideReason: value.overrideReason ?? null };
}
export function interviewModel(value: InterviewView): InterviewSchedulePayload {
  if (!value || !value.id || !value.applicationId || !Array.isArray(value.participantIds)
      || !Number.isSafeInteger(value.version) || !['SCHEDULED', 'CANCELLED'].includes(value.status)
      || !['ONLINE', 'ONSITE'].includes(value.mode) || !Number.isFinite(Date.parse(value.startsAt))
      || !Number.isFinite(Date.parse(value.endsAt))) throw new Error('Response lịch phỏng vấn không hợp lệ.');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric',
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value.startsAt));
  const part = (key: string) => parts.find(p => p.type === key)?.value ?? '';
  return { id: value.id, applicationId: value.applicationId, candidateId: '', candidateName: '',
    roundName: value.roundName, interviewRound: value.roundName,
    scheduledDateTimeISO: value.startsAt, startTime: value.startsAt,
    interviewDate: `${part('year')}-${part('month')}-${part('day')}`, interviewTime: `${part('hour')}:${part('minute')}`,
    durationMinutes: (Date.parse(value.endsAt) - Date.parse(value.startsAt)) / 60000,
    format: value.mode === 'ONSITE' ? 'OFFLINE' : 'ONLINE', locationOrLink: value.room || value.meetingUrl || '',
    interviewerIds: value.participantIds, interviewers: [], status: value.status, version: value.version,
    createdAt: value.createdAt };
}
async function pages(path: string): Promise<InterviewSchedulePayload[]> {
    requireFeature('schedules');
  const items: InterviewSchedulePayload[] = [];
  let page = 0;
  while (true) {
    const value = (await client.get<InterviewPage>(path, { params: { page, size: 100 } })).data;
    if (!value || !Array.isArray(value.items) || value.page !== page || !Number.isSafeInteger(value.totalElements)
        || value.totalElements < 0 || value.size < 1) throw new Error('Response phân trang lịch không hợp lệ.');
    items.push(...value.items.map(interviewModel));
    if ((page + 1) * value.size >= value.totalElements) return items;
    if (!value.items.length || ++page > 1000) throw new Error('Phân trang lịch không nhất quán.');
  }
}
export const interviewApi = {
  async create(payload: CreateInterviewSchedulePayload) {
    requireFeature('scheduleWrites');
    const value = (await client.post<InterviewView>(`/applications/${encodeURIComponent(payload.applicationId)}/interviews`, scheduleRequest(payload))).data;
    return interviewModel(value);
  },
  async update(id: string, payload: CreateInterviewSchedulePayload) {
    requireFeature('scheduleWrites');
    if (payload.expectedVersion === undefined) throw new Error('Thiếu version lịch. Tải lại trước khi sửa.');
    return interviewModel((await client.put<InterviewView>(`/interviews/${encodeURIComponent(id)}`, scheduleRequest(payload))).data);
  },
  async cancel(id: string, expectedVersion: number, reason: string) {
    requireFeature('scheduleWrites');
    if (!Number.isSafeInteger(expectedVersion) || !reason.trim()) throw new Error('Cần version và lý do hủy lịch.');
    return interviewModel((await client.post<InterviewView>(`/interviews/${encodeURIComponent(id)}/cancel`, { expectedVersion, reason: reason.trim() })).data);
  },
  list(applicationId: string) {
    if (!applicationId) throw new Error('Cần mã hồ sơ ứng tuyển để tải lịch.');
    return pages(`/applications/${encodeURIComponent(applicationId)}/interviews`);
  },
  async mine(params?: PersonalScheduleParams) {
    const values = await pages('/interviews/me');
    return values.filter(item => (!params?.date || item.interviewDate === params.date)
      && (!params?.startDate || item.interviewDate >= params.startDate)
      && (!params?.endDate || item.interviewDate <= params.endDate)
      && (!params?.status || params.status === 'ALL' || item.status === params.status)
      && (!params?.search || `${item.roundName} ${item.locationOrLink}`.toLocaleLowerCase().includes(params.search.toLocaleLowerCase())));
  },
};
