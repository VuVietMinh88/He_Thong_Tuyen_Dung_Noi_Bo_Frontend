import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { InterviewerCalendarPage } from '../src/pages/Interview/InterviewerCalendarPage';
import { calculateEndTime } from '../src/services/interviewService';
import { tokenService } from '../src/services/token.service';

const calendarState = vi.hoisted(() => ({ items: null as unknown[] | null }));
vi.mock('react', async (original) => {
  const actual = await original<typeof import('react')>();
  return { ...actual, useState: (initial: unknown) => {
    if (calendarState.items && Array.isArray(initial) && initial.length === 0) {
      const items = calendarState.items; calendarState.items = null;
      return actual.useState(items);
    }
    return actual.useState(initial);
  } };
});
const storage = new Map<string, string>();
function seedSchedule() {
  calendarState.items = [{ id: 'server-interview', applicationId: 'app-1', candidateId: '', candidateName: '',
    roundName: 'Server round', interviewDate: '2026-10-25', interviewTime: '14:00',
    startTime: '2026-10-25T07:00:00Z', scheduledDateTimeISO: '2026-10-25T07:00:00Z',
    durationMinutes: 60, format: 'ONLINE', locationOrLink: 'https://meet.example.com/room',
    interviewerIds: ['usr-001'], interviewers: [], status: 'SCHEDULED', isEvaluationSubmitted: false, version: 0 }];
}

describe('TKNHTTDNB1-475 / TKNHTTDNB1-68 (User Story S7-01): Lịch cá nhân cho người phỏng vấn', () => {
  beforeEach(() => {
    calendarState.items = null;
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-20T00:00:00Z'));
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    });
    vi.restoreAllMocks();

    // Mock thông tin tài khoản Người phỏng vấn đăng nhập (AC 3)
    vi.spyOn(tokenService, 'getUserData').mockReturnValue({
      id: 'usr-001',
      fullName: 'Nguyễn Văn Hải',
      email: 'hai.nguyen@smartrecruitment.vn',
      roles: ['INTERVIEWER'],
      departmentName: 'Bộ phận Công nghệ & Kỹ thuật',
    });
  });

  afterEach(() => { calendarState.items = null; vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  describe('AC 1: Hiển thị danh sách buổi phỏng vấn sắp tới (Upcoming Interviews List & Calendar View)', () => {
    it('hiển thị đầy đủ tiêu đề, chế độ xem Danh sách thẻ (Cards) và Lịch tuần (Calendar View)', () => {
      const html = renderToString(
        <MemoryRouter>
          <InterviewerCalendarPage />
        </MemoryRouter>
      );

      // Tiêu đề trang
      expect(html).toContain('Lịch cá nhân người phỏng vấn');
      // Chế độ chuyển đổi View Mode
      expect(html).toContain('Danh sách');
      expect(html).toContain('Lịch tuần');
      // Hộp tìm kiếm và lọc
      expect(html).toContain('placeholder="Tìm theo tên ứng viên, vị trí tuyển dụng, phòng ban, vòng phỏng vấn..."');
    });

    it('tính toán chính xác thời gian kết thúc dựa trên thời gian bắt đầu và thời lượng (Asia/Ho_Chi_Minh)', () => {
      const start1 = '14:00';
      const duration1 = 60;
      const end1 = calculateEndTime(start1, duration1);
      expect(end1).toBe('15:00');

      const start2 = '09:30';
      const duration2 = 45;
      const end2 = calculateEndTime(start2, duration2);
      expect(end2).toBe('10:15');
    });

    it('cung cấp các tab bộ lọc trạng thái nhanh (Tất cả, Cần nộp đánh giá, Hôm nay, Sắp tới, Đã xong)', () => {
      const html = renderToString(
        <MemoryRouter>
          <InterviewerCalendarPage />
        </MemoryRouter>
      );

      expect(html).toContain('Tất cả');
      expect(html).toContain('Cần nộp đánh giá');
      expect(html).toContain('Hôm nay');
      expect(html).toContain('Sắp tới');
      expect(html).toContain('Đã xong');
    });
  });

  describe('AC 2: Liên kết mở CV & Đánh dấu trạng thái Phiếu đánh giá (CV Link & Evaluation Badge)', () => {
    it('hiển thị CV không khả dụng rõ ràng khi chưa có contract truy cập hồ sơ', () => {
      seedSchedule();
      const html = renderToString(
        <MemoryRouter>
          <InterviewerCalendarPage />
        </MemoryRouter>
      );

      expect(html).toContain('Xem trước CV');
      expect(html).toMatch(/<button[^>]*disabled=""[^>]*title="Chức năng xem CV theo phân công hiện chưa khả dụng/);
      expect(html).toContain('Server round');
    });

    it('hiển thị thẻ cảnh báo và nút thao tác nộp phiếu đánh giá năng lực', () => {
      seedSchedule();
      const html = renderToString(
        <MemoryRouter>
          <InterviewerCalendarPage />
        </MemoryRouter>
      );

      expect(html).toContain('Chưa nộp đánh giá');
      expect(html).toContain('Đánh giá năng lực');
      expect(html).toContain('Server round');
      expect(html).not.toContain('Đã nộp phiếu đánh giá');
    });
  });

  describe('AC 3: Phân quyền bảo mật dữ liệu (Data Privacy & Access Control)', () => {
    it('hiển thị thông tin định danh của người phỏng vấn và nhãn phân quyền cá nhân', () => {
      const html = renderToString(
        <MemoryRouter>
          <InterviewerCalendarPage />
        </MemoryRouter>
      );

      expect(html).toContain('Phân quyền cá nhân');
      expect(html).toContain('Nguyễn Văn Hải');
      expect(html).toContain('hai.nguyen@smartrecruitment.vn');
      expect(html).toContain('Chỉ hiển thị lịch bạn được mời');
    });

    it('bảo vệ dữ liệu nhạy cảm: không bao giờ chứa thông tin lương hay offer trong giao diện lịch cá nhân', () => {
      const html = renderToString(
        <MemoryRouter>
          <InterviewerCalendarPage />
        </MemoryRouter>
      );

      expect(html).not.toContain('Mức lương hiện tại');
      expect(html).not.toContain('Mức lương kỳ vọng');
      expect(html).not.toContain('Lương thỏa thuận');
      expect(html).not.toContain('Thư mời nhận việc (Offer)');
    });
  });
});

