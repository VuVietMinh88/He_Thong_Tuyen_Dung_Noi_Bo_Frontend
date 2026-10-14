import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type {
  TalentPoolCandidateSuggestion,
  TalentPoolSearchParams,
} from '../src/types/talentPool';
import {
  talentPoolService,
} from '../src/services/talentPoolService';
import { SmartTalentMatchingPanel } from '../src/components/Candidate/SmartTalentMatchingPanel';
import { AssignCandidateToJobModal } from '../src/components/Candidate/AssignCandidateToJobModal';
import { TalentCandidateHistoryModal } from '../src/components/Candidate/TalentCandidateHistoryModal';
import { CandidateManagementPage } from '../src/pages/Candidate/CandidateManagementPage';
import axiosClient from '../src/utils/axiosClient';

describe('Task Jira TKNHTTDNB1-397: Tích hợp tìm kiếm kho và gợi ý cho vị trí mới (User Story S5-04)', () => {
  const sampleCandidate: TalentPoolCandidateSuggestion = {
    id: 'talent-001',
    candidateId: 'cand-pool-101',
    fullName: 'Nguyễn Thành Long',
    email: 'thanhlong.nguyen@example.com',
    phone: '0912345678',
    category: 'Frontend Core',
    experienceYears: 5,
    currentTitle: 'Senior Frontend Developer',
    previousAppliedJobTitle: 'Lập trình viên React Senior',
    skills: ['React', 'TypeScript', 'Redux', 'Tailwind CSS', 'Next.js'],
    matchedSkills: ['React', 'TypeScript', 'Tailwind CSS'],
    missingSkills: ['Node.js'],
    matchScore: 92,
    notes: 'Ứng viên có tư duy component tốt, pass bài test kiến trúc React điểm 9.5/10.',
    addedToPoolAt: '2026-08-15T10:00:00Z',
    contactRecommendation: 'Sau 3 tháng',
    isAssigned: false,
  };

  const sampleAssignedCandidate: TalentPoolCandidateSuggestion = {
    ...sampleCandidate,
    id: 'talent-002',
    candidateId: 'cand-pool-102',
    fullName: 'Trần Thu Hà',
    email: 'thuha.tran@example.com',
    matchScore: 85,
    isAssigned: true,
    assignedJobId: 'job-react-01',
    assignedStage: 'ROUND_1',
  };

  const mockJobOptions = [
    { id: 'job-react-01', title: 'Lập trình viên React Senior Hà Nội' },
    { id: 'job-devops-02', title: 'Kỹ sư DevOps Kubernetes' },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    talentPoolService._resetMemoryState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. AC 1: Bảng Gợi ý ứng viên phù hợp (Smart Talent Matching)', () => {
    it('hiển thị tiêu đề, badge đếm số lượng hồ sơ phù hợp và dropdown chọn vị trí', () => {
      const html = renderToString(
        React.createElement(SmartTalentMatchingPanel, {
          initialJobId: 'job-react-01',
          initialJobTitle: 'Lập trình viên React Senior Hà Nội',
          jobOptions: mockJobOptions,
        })
      );

      expect(html).toContain('Gợi ý ứng viên từ Kho tiềm năng (Smart Talent Matching)');
      expect(html).toContain('data-testid="smart-talent-matching-panel"');
      expect(html).toContain('data-testid="matching-count-badge"');
      expect(html).toContain('data-testid="matching-job-select"');
      expect(html).toContain('Lập trình viên React Senior Hà Nội');
      expect(html).toContain('Kỹ sư DevOps Kubernetes');
    });

    it('hiển thị thanh tìm kiếm từ khóa và các bộ lọc đa tiêu chí', () => {
      const html = renderToString(
        React.createElement(SmartTalentMatchingPanel, {
          jobOptions: mockJobOptions,
        })
      );

      expect(html).toContain('data-testid="talent-search-input"');
      expect(html).toContain('data-testid="talent-category-filter"');
      expect(html).toContain('data-testid="min-score-filter"');
      expect(html).toContain('data-testid="talent-sort-select"');
      expect(html).toContain('data-testid="reset-talent-filter-btn"');

      // Tùy chọn lọc điểm phù hợp
      expect(html).toContain('Khớp từ 70% trở lên');
      expect(html).toContain('Khớp từ 80% trở lên');
      expect(html).toContain('Khớp từ 90% (Rất cao)');
    });
  });

  describe('2. AC 2: Thao tác nhanh với ứng viên được gợi ý', () => {
    it('AssignCandidateToJobModal hiển thị tóm tắt ứng viên, dropdown vòng tuyển dụng và nút xác nhận', () => {
      const html = renderToString(
        React.createElement(AssignCandidateToJobModal, {
          isOpen: true,
          candidate: sampleCandidate,
          selectedJobId: 'job-react-01',
          selectedJobTitle: 'Lập trình viên React Senior Hà Nội',
          jobOptions: mockJobOptions,
          onClose: () => {},
        })
      );

      expect(html).toContain('Mời ứng tuyển &amp; Gán vào Vòng tuyển dụng');
      expect(html).toContain('data-testid="assign-candidate-to-job-modal"');
      expect(html).toContain('Nguyễn Thành Long');
      expect(html).toContain('92% phù hợp');
      expect(html).toContain('data-testid="initial-stage-select"');
      expect(html).toContain('data-testid="assign-notes-textarea"');
      expect(html).toContain('data-testid="confirm-assign-btn"');
      expect(html).toContain('data-testid="cancel-assign-btn"');
    });

    it('TalentCandidateHistoryModal hiển thị ghi chú của recruiter và mốc liên hệ lại đề xuất', () => {
      const html = renderToString(
        React.createElement(TalentCandidateHistoryModal, {
          isOpen: true,
          candidate: sampleCandidate,
          onClose: () => {},
        })
      );

      expect(html).toContain('Lịch sử Đánh giá &amp; Ghi chú Kho tiềm năng');
      expect(html).toContain('data-testid="talent-candidate-history-modal"');
      expect(html).toContain('Nguyễn Thành Long');
      expect(html).toContain('Frontend Core');
      expect(html).toContain('5 năm KN');
    });

    it('hiển thị badge "Đã gán vào tin tuyển dụng" khi ứng viên đã được gán', () => {
      const htmlModal = renderToString(
        React.createElement(AssignCandidateToJobModal, {
          isOpen: true,
          candidate: sampleAssignedCandidate,
          onClose: () => {},
        })
      );
      expect(htmlModal).toContain('Trần Thu Hà');
      expect(htmlModal).toContain('85% phù hợp');
    });
  });

  describe('3. AC 3: Service talentPoolService & Xử lý bất đồng bộ', () => {
    it('getTalentPoolSuggestions trả về danh sách ứng viên gợi ý sắp xếp theo điểm phù hợp', async () => {
      const list = await talentPoolService.getTalentPoolSuggestions('job-react-01');
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].matchScore).toBeGreaterThanOrEqual(list[list.length - 1].matchScore);
    });

    it('getTalentPoolSuggestions lọc chính xác theo từ khóa', async () => {
      const list = await talentPoolService.getTalentPoolSuggestions('job-react-01', {
        keyword: 'Kubernetes',
      });
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((c) => c.skills.includes('Kubernetes') || c.fullName.includes('Kubernetes'))).toBe(true);
    });

    it('getTalentPoolSuggestions lọc theo nhóm category', async () => {
      const list = await talentPoolService.getTalentPoolSuggestions('job-react-01', {
        category: 'DevOps Dự phòng',
      });
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((c) => c.category === 'DevOps Dự phòng')).toBe(true);
    });

    it('getTalentPoolSuggestions lọc theo mức điểm tối thiểu (>= 90%)', async () => {
      const list = await talentPoolService.getTalentPoolSuggestions('job-react-01', {
        minMatchScore: 90,
      });
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((c) => c.matchScore >= 90)).toBe(true);
    });

    it('getTalentPoolSuggestions gọi API GET /recruitment/talent-pool/suggestions', async () => {
      const mockResult: TalentPoolCandidateSuggestion[] = [sampleCandidate];
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: { data: mockResult },
      });

      const params: TalentPoolSearchParams = { keyword: 'React', minMatchScore: 80 };
      const res = await talentPoolService.getTalentPoolSuggestions('job-react-01', params);

      expect(getSpy).toHaveBeenCalledWith(
        '/recruitment/talent-pool/suggestions',
        expect.objectContaining({
          params: expect.objectContaining({
            jobId: 'job-react-01',
            keyword: 'React',
            minMatchScore: 80,
          }),
        })
      );
      expect(res).toEqual(mockResult);
    });

    it('assignCandidateToJob gán ứng viên thành công và đánh dấu isAssigned = true', async () => {
      const updated = await talentPoolService.assignCandidateToJob({
        candidateId: 'cand-pool-101',
        jobId: 'job-react-01',
        initialStage: 'ROUND_1',
        notes: 'Chuyển thẳng vào vòng phỏng vấn kỹ thuật',
      });

      expect(updated.isAssigned).toBe(true);
      expect(updated.assignedJobId).toBe('job-react-01');
      expect(updated.assignedStage).toBe('ROUND_1');
    });

    it('assignCandidateToJob ném lỗi khi thiếu thông tin bắt buộc', async () => {
      await expect(
        talentPoolService.assignCandidateToJob({
          candidateId: '',
          jobId: 'job-01',
          initialStage: 'ROUND_1',
        })
      ).rejects.toThrow('Mã ứng viên không hợp lệ');

      await expect(
        talentPoolService.assignCandidateToJob({
          candidateId: 'cand-01',
          jobId: '',
          initialStage: 'ROUND_1',
        })
      ).rejects.toThrow('Vui lòng chọn vị trí tuyển dụng để gán ứng viên');

      await expect(
        talentPoolService.assignCandidateToJob({
          candidateId: 'cand-01',
          jobId: 'job-01',
          initialStage: '',
        })
      ).rejects.toThrow('Vui lòng chọn vòng tuyển dụng khởi đầu');
    });

    it('getTalentPoolCandidateHistory trả về lịch sử ghi chú đánh giá', async () => {
      const history = await talentPoolService.getTalentPoolCandidateHistory('cand-pool-101');
      expect(history.candidateName).toBe('Nguyễn Thành Long');
      expect(history.category).toBe('Frontend Core');
      expect(history.previousApplication).toBeDefined();
      expect(history.previousApplication?.jobTitle).toBe('Lập trình viên React Senior');
    });
  });

  describe('4. Tích hợp trên CandidateManagementPage', () => {
    it('hiển thị nút chuyển sang chế độ "Gợi ý Kho tiềm năng"', () => {
      const html = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CandidateManagementPage, {
            initialCandidates: [],
            initialIsLoading: false,
          })
        )
      );

      expect(html).toContain('data-testid="view-talent-matching-btn"');
      expect(html).toContain('Gợi ý Kho tiềm năng');
    });
  });
});
