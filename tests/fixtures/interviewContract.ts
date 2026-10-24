import axios from 'axios';
import type { InterviewView } from '../../src/services/interviewApi';
import type { EvaluationView } from '../../src/services/evaluationApi';
export function interview(overrides: Partial<InterviewView> = {}): InterviewView {
  return { id: 'interview-1', applicationId: 'app-1', roundName: 'Vòng Kỹ thuật',
    startsAt: '2026-11-25T07:00:00Z', endsAt: '2026-11-25T08:00:00Z', mode: 'ONLINE',
    room: null, meetingUrl: 'https://meet.example.com/interview', status: 'SCHEDULED',
    version: 0, participantIds: ['usr-001'], createdAt: '2026-10-01T00:00:00Z', ...overrides };
}
export const page = (items: InterviewView[]) => ({ items, totalElements: items.length, page: 0, size: 100 });
export function httpError(status: number, code: string, message = code) {
  const error = new axios.AxiosError(message);
  error.response = { status, statusText: message, data: { code, message }, headers: {}, config: {} as never };
  return error;
}
export function evaluation(overrides: Partial<EvaluationView> = {}): EvaluationView {
  return { id: 'form-1', interviewId: 'itv-test-101', applicationId: 'app-test-101', evaluatorId: 'user-interviewer-01',
    framework: { id: 'framework-1', code: 'CF', name: 'Snapshot' }, status: 'DRAFT', version: 3,
    items: [{ criterionId: 'criterion-1', name: 'Skill', description: null, weight: 100, sortOrder: 0, score: null, comment: null }],
    conclusion: null, totalScore: null, firstSubmittedAt: null, submittedAt: null, updatedAt: '2026-10-20T00:00:00Z', ...overrides };
}
export const answers = { 'criterion-1': { criterionId: 'criterion-1', criterionName: 'Skill', weight: 100, score: 4, comment: 'Evidence' } };
