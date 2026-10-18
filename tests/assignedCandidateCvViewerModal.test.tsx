import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AssignedCandidateCvViewerModal } from '../src/components/Interview/AssignedCandidateCvViewerModal';
import type { AssignedCandidateProfileResult } from '../src/types/interview';

describe('AssignedCandidateCvViewerModal (S7-01 / TKNHTTDNB1-476)', () => {
  const sampleProfile: AssignedCandidateProfileResult = {
    candidateId: 'can-001',
    applicationId: 'app-001',
    interviewId: 'itv-001',
    fullName: 'Hoàng Minh Tuấn',
    email: 'tuan.hoang@gmail.com',
    phone: '0912 345 678',
    appliedJobTitle: 'Senior React Developer',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    experienceYears: 4,
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit'],
    educationLevel: 'Đại học Quốc gia Hà Nội - CNTT',
    currentCompany: 'FPT Software',
    cvUrl: 'https://smartrecruitment.vn/cvs/CV_Hoang_Minh_Tuan.pdf',
    cvFileName: 'CV_Hoang_Minh_Tuan.pdf',
    cvFileType: 'pdf',
    summary: 'Lập trình viên đam mê kiến tạo trải nghiệm người dùng hiện đại và hiệu năng cao.',
    appliedAt: '2026-10-15T08:30:00Z',
    interviewRound: 'Vòng Chuyên môn',
    interviewDate: '2026-10-18',
    interviewTime: '15:00',
    interviewFormat: 'ONLINE',
    interviewLocationOrLink: 'https://meet.google.com/xyz-abcd-efg',
    isEvaluationSubmitted: false,
  };

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      <AssignedCandidateCvViewerModal
        isOpen={false}
        onClose={() => {}}
        profile={sampleProfile}
      />,
    );
    expect(html).toBe('');
  });

  it('renders loading state when isLoading is true', () => {
    const html = renderToString(
      <AssignedCandidateCvViewerModal
        isOpen={true}
        onClose={() => {}}
        profile={null}
        isLoading={true}
      />,
    );
    expect(html).toContain('Đang tải tệp CV và xác thực phân quyền...');
  });

  it('renders complete candidate profile information and CV viewer', () => {
    const html = renderToString(
      <AssignedCandidateCvViewerModal
        isOpen={true}
        onClose={() => {}}
        profile={sampleProfile}
      />,
    );

    // Header & Badge
    expect(html).toContain('Hoàng Minh Tuấn');
    expect(html).toContain('Quyền người phỏng vấn');
    expect(html).toContain('Senior React Developer');

    // Thông tin liên hệ & Kỹ năng
    expect(html).toContain('tuan.hoang@gmail.com');
    expect(html).toContain('0912 345 678');
    expect(html).toContain('FPT Software');
    expect(html).toContain('Kinh nghiệm:');
    expect(html).toContain('React');
    expect(html).toContain('TypeScript');
    expect(html).toContain('Tailwind CSS');

    // Chi tiết buổi phỏng vấn
    expect(html).toContain('Vòng Chuyên môn');
    expect(html).toContain('2026-10-18');
    expect(html).toContain('15:00');
    expect(html).toContain('https://meet.google.com/xyz-abcd-efg');

    // Nút tải xuống và mở tab mới
    expect(html).toContain('Tải tệp CV');
    expect(html).toContain('Mở tab mới');

    // Iframe preview tệp PDF
    expect(html).toContain('src="https://smartrecruitment.vn/cvs/CV_Hoang_Minh_Tuan.pdf#toolbar=0"');
    expect(html).toContain('Đã xác thực quyền xem hồ sơ dành riêng cho người phỏng vấn được mời.');
  });

  it('renders warning when CV file is not available', () => {
    const profileWithoutCv: AssignedCandidateProfileResult = {
      ...sampleProfile,
      cvUrl: undefined,
    };

    const html = renderToString(
      <AssignedCandidateCvViewerModal
        isOpen={true}
        onClose={() => {}}
        profile={profileWithoutCv}
      />,
    );

    expect(html).toContain('Chưa có liên kết tệp CV trực tuyến');
  });
});
