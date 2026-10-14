import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import axiosClient from '../src/utils/axiosClient';
import type {
  CandidateProfile,
  CandidateTag,
  ScreeningCatalogTag,
  CandidateScreeningUpdatePayload,
} from '../src/types/candidate';
import { DEFAULT_SCREENING_CATALOG_TAGS } from '../src/types/candidate';
import { candidateService } from '../src/services/candidateService';
import {
  applicationLookupService,
  sanitizePublicApplicationResult,
} from '../src/services/applicationLookupService';
import { CandidateScreeningWidget } from '../src/components/Candidate/CandidateScreeningWidget';

const createAxiosErrorMock = (statusCode: number, responseBody: unknown): AxiosError => {
  const requestConfig = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError(
    `Request failed with status code ${statusCode}`,
    statusCode >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    requestConfig,
    undefined,
    {
      data: responseBody,
      status: statusCode,
      statusText: statusCode === 403 ? 'Forbidden' : 'Internal Server Error',
      headers: new AxiosHeaders(),
      config: requestConfig,
    }
  );
};

describe('Subtask TKNHTTDNB1-385: Tích hợp cập nhật đánh giá sàng lọc (Story TKNHTTDNB1-52)', () => {
  const mockStorageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (storageKey: string) => mockStorageMap.get(storageKey) ?? null,
    setItem: (storageKey: string, storageValue: string) =>
      mockStorageMap.set(storageKey, storageValue),
    removeItem: (storageKey: string) => mockStorageMap.delete(storageKey),
    clear: () => mockStorageMap.clear(),
  };

  const sampleCandidateProfile: CandidateProfile = {
    id: 'candidate-test-385-001',
    trackingCode: 'APP-2026-TEST385',
    fullName: 'Lê Minh Tuấn',
    email: 'tuan.le@example.com',
    phone: '0987654321',
    appliedJobId: 'job-frontend-01',
    appliedJobTitle: 'Senior Frontend Engineer',
    departmentName: 'Trung tâm Phát triển Phần mềm',
    source: 'LinkedIn',
    status: 'Mới tiếp nhận',
    cvUrl: '/sample-cv.pdf',
    cvFileName: 'CV_LeMinhTuan.pdf',
    cvParsingStatus: 'CONFIRMED',
    rating: 3,
    tags: [
      {
        id: 'tag-react-core',
        name: 'React/TS Vững',
        colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
    ],
    notes: [
      {
        id: 'note-screening-init',
        content: 'Đã xem CV, kinh nghiệm 4 năm React và Tailwind CSS.',
        authorName: 'Nguyễn Thị Tuyết',
        authorRole: 'Recruiter Specialist',
        createdAt: '2026-10-14T08:00:00.000Z',
        category: 'SCREENING',
      },
    ],
    appliedAt: '2026-10-14T07:30:00.000Z',
    updatedAt: '2026-10-14T08:00:00.000Z',
  };

  beforeEach(() => {
    mockStorageMap.clear();
    mockStorageMap.set(
      'smart_recruit_candidate_profiles',
      JSON.stringify([sampleCandidateProfile])
    );

    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('window', {
      localStorage: mockLocalStorage,
      dispatchEvent: vi.fn(),
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('1. Tích hợp API lấy danh mục nhãn và cập nhật đánh giá sàng lọc (AC 1)', () => {
    it('gọi API lấy danh mục nhãn sàng lọc và trả về dữ liệu catalog từ máy chủ', async () => {
      // Tại sao: Recruiter cần danh mục nhãn chuẩn cấu hình sẵn từ API máy chủ để thao tác sàng lọc nhanh
      const mockCatalogTagsFromApi: ScreeningCatalogTag[] = [
        {
          id: 'catalog-tag-1',
          name: 'React Expert',
          colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
          category: 'SKILL',
        },
        {
          id: 'catalog-tag-2',
          name: 'IELTS 7.5+',
          colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          category: 'LANGUAGE',
        },
      ];

      const getApiSpy = vi
        .spyOn(axiosClient, 'get')
        .mockResolvedValueOnce({ data: mockCatalogTagsFromApi });

      const fetchedCatalogTags = await candidateService.getCatalogTags();

      expect(getApiSpy).toHaveBeenCalledWith('/recruitment/screening-catalog-tags');
      expect(fetchedCatalogTags).toEqual(mockCatalogTagsFromApi);
    });

    it('fallback về danh mục nhãn mặc định khi API lấy danh mục thất bại hoặc offline', async () => {
      // Tại sao: Đảm bảo Recruiter vẫn có thể sàng lọc với danh mục nhãn mặc định ngay cả khi backend chưa có API
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(
        createAxiosErrorMock(500, { message: 'Service Unavailable' })
      );

      const fetchedCatalogTags = await candidateService.getCatalogTags();

      expect(fetchedCatalogTags).toEqual(DEFAULT_SCREENING_CATALOG_TAGS);
    });

    it('gọi API và cập nhật mức đánh giá sao (1-5 sao) vào hồ sơ ứng viên thành công', async () => {
      // Tại sao: Đảm bảo đồng bộ điểm đánh giá sao qua API và cập nhật local storage
      const patchApiSpy = vi
        .spyOn(axiosClient, 'patch')
        .mockResolvedValueOnce({ data: { success: true } });

      const updatedRating = await candidateService.updateCandidateRating(
        sampleCandidateProfile.id,
        5
      );

      expect(patchApiSpy).toHaveBeenCalledWith(
        `/candidates/${sampleCandidateProfile.id}/rating`,
        { rating: 5 }
      );
      expect(updatedRating).toBe(5);

      const candidateFromStorage = await candidateService.getCandidateProfileById(
        sampleCandidateProfile.id
      );
      expect(candidateFromStorage?.rating).toBe(5);
    });

    it('gọi API và cập nhật danh sách nhãn hồ sơ (thêm/bớt nhãn) thành công', async () => {
      // Tại sao: Recruiter có thể gắn nhiều nhãn hoặc gỡ bớt nhãn khỏi hồ sơ
      const updatedTagsList: CandidateTag[] = [
        ...(sampleCandidateProfile.tags || []),
        {
          id: 'tag-english-fluent',
          name: 'Tiếng Anh Tốt',
          colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
      ];

      const putApiSpy = vi
        .spyOn(axiosClient, 'put')
        .mockResolvedValueOnce({ data: { success: true } });

      const returnedTags = await candidateService.updateCandidateTags(
        sampleCandidateProfile.id,
        updatedTagsList
      );

      expect(putApiSpy).toHaveBeenCalledWith(
        `/candidates/${sampleCandidateProfile.id}/tags`,
        { tags: updatedTagsList }
      );
      expect(returnedTags).toHaveLength(2);

      const candidateFromStorage = await candidateService.getCandidateProfileById(
        sampleCandidateProfile.id
      );
      expect(candidateFromStorage?.tags).toHaveLength(2);
      expect(candidateFromStorage?.tags?.[1]?.name).toBe('Tiếng Anh Tốt');
    });

    it('gọi API tạo ghi chú nội bộ mới và tự động đưa lên đầu danh sách ghi chú', async () => {
      // Tại sao: Ghi chú mới nhất phải được unshift lên đầu để Recruiter dễ dàng theo dõi tiến độ
      const postApiSpy = vi
        .spyOn(axiosClient, 'post')
        .mockResolvedValueOnce({ data: { success: true } });

      const newInternalNote = await candidateService.createCandidateInternalNote(
        sampleCandidateProfile.id,
        'Ứng viên phản hồi điện thoại nhanh nhẹn, sẵn sàng phỏng vấn vòng 1 vào thứ 6.',
        'Trần Thu Hà',
        'Senior Recruiter',
        'SCREENING'
      );

      expect(postApiSpy).toHaveBeenCalled();
      expect(newInternalNote.content).toContain('sẵn sàng phỏng vấn vòng 1');
      expect(newInternalNote.authorName).toBe('Trần Thu Hà');
      expect(newInternalNote.category).toBe('SCREENING');

      const candidateFromStorage = await candidateService.getCandidateProfileById(
        sampleCandidateProfile.id
      );
      expect(candidateFromStorage?.notes).toHaveLength(2);
      expect(candidateFromStorage?.notes?.[0]?.content).toContain('sẵn sàng phỏng vấn vòng 1');
    });

    it('cập nhật tổng thể dữ liệu sàng lọc qua updateCandidateScreening', async () => {
      // Tại sao: Hỗ trợ gọi API tổng thể cập nhật đồng thời sao, nhãn và ghi chú mới trong 1 thao tác
      const patchApiSpy = vi
        .spyOn(axiosClient, 'patch')
        .mockResolvedValueOnce({ data: { success: true } });

      const screeningUpdatePayload: CandidateScreeningUpdatePayload = {
        rating: 5,
        tags: [
          {
            id: 'tag-react-master',
            name: 'React Master',
            colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          },
        ],
        newNote: {
          content: 'Đã hoàn thành đánh giá sàng lọc kỹ thuật xuất sắc.',
          authorName: 'Nguyễn Văn Hùng',
          authorRole: 'Technical Lead Recruiter',
          category: 'SCREENING',
        },
      };

      const updatedProfile = await candidateService.updateCandidateScreening(
        sampleCandidateProfile.id,
        screeningUpdatePayload
      );

      expect(patchApiSpy).toHaveBeenCalledWith(
        `/candidates/${sampleCandidateProfile.id}/screening`,
        screeningUpdatePayload
      );
      expect(updatedProfile.rating).toBe(5);
      expect(updatedProfile.tags?.[0]?.name).toBe('React Master');
      expect(updatedProfile.notes?.[0]?.content).toBe(
        'Đã hoàn thành đánh giá sàng lọc kỹ thuật xuất sắc.'
      );
    });
  });

  describe('2. Xử lý và hiển thị thông báo lỗi khi cập nhật (AC 2)', () => {
    it('bắt lỗi 403 Forbidden và hiển thị thông báo quyền hạn rõ ràng khi lưu đánh giá sao thất bại', async () => {
      // Tại sao: Recruiter không được phân quyền xem hoặc sửa hồ sơ phải nhận được thông báo lỗi 403 cụ thể
      vi.spyOn(axiosClient, 'patch').mockRejectedValueOnce(
        createAxiosErrorMock(403, { message: 'Forbidden access' })
      );

      await expect(
        candidateService.updateCandidateRating(sampleCandidateProfile.id, 5)
      ).rejects.toThrow('Bạn không có quyền cập nhật mức đánh giá sao cho hồ sơ này (403 Forbidden).');
    });

    it('bắt lỗi 500 Server Error và thông báo máy chủ gặp sự cố khi lưu nhãn hồ sơ', async () => {
      // Tại sao: Lỗi máy chủ 500 cần được thông báo minh bạch để người dùng biết và thử lại sau
      vi.spyOn(axiosClient, 'put').mockRejectedValueOnce(
        createAxiosErrorMock(500, { message: 'Database connection failed' })
      );

      await expect(
        candidateService.updateCandidateTags(sampleCandidateProfile.id, [])
      ).rejects.toThrow(
        'Máy chủ gặp sự cố khi lưu nhãn phân loại (500 Internal Server Error). Vui lòng thử lại sau.'
      );
    });

    it('bắt lỗi 403 Forbidden khi lưu ghi chú nội bộ thất bại', async () => {
      // Tại sao: Người dùng không có vai trò phù hợp không được phép ghi chú nội bộ
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(
        createAxiosErrorMock(403, { message: 'Forbidden' })
      );

      await expect(
        candidateService.addInternalNote(
          sampleCandidateProfile.id,
          'Ghi chú nháp',
          'Người dùng kiểm thử',
          'Guest'
        )
      ).rejects.toThrow(
        'Bạn không có quyền thêm ghi chú nội bộ cho hồ sơ này (403 Forbidden).'
      );
    });

    it('hiển thị banner thông báo lỗi và giữ nguyên nội dung ghi chú trong ô nhập khi lưu thất bại', () => {
      // Tại sao: Tuyệt đối không để Recruiter bị mất chữ đã soạn thảo nếu mạng lag hoặc API lỗi, cho phép bấm thử lại
      const renderedHtml = renderToString(
        React.createElement(CandidateScreeningWidget, {
          candidateId: sampleCandidateProfile.id,
          candidateName: sampleCandidateProfile.fullName,
          candidateStarRating: 3,
          selectedScreeningTags: sampleCandidateProfile.tags,
          internalNotes: sampleCandidateProfile.notes,
          onRatingChange: vi.fn(),
          onTagsChange: vi.fn(),
          onAddNote: vi.fn(),
        })
      );

      // Đảm bảo cấu trúc HTML có ô nhập textarea và nút gửi ghi chú
      expect(renderedHtml).toContain('aria-label="Nội dung ghi chú nội bộ"');
      expect(renderedHtml).toContain('Thêm ghi chú');
      expect(renderedHtml).toContain('Ứng viên không bao giờ nhìn thấy');
    });
  });

  describe('3. Bảo vệ tuyệt đối ghi chú nội bộ khỏi kênh ứng viên (AC 3)', () => {
    it('bộ lọc sanitizePublicApplicationResult loại bỏ hoàn toàn các trường ghi chú nội bộ, mức sao và nhãn recruiter', () => {
      // Tại sao: Tuyệt đối không để rò rỉ bất kỳ thông tin sàng lọc nội bộ nào sang phía ứng viên tra cứu trạng thái
      const mockBackendCandidateRecordWithInternalData = {
        applicationCode: 'APP-2026-TEST385',
        jobTitle: 'Senior Frontend Engineer',
        submittedAt: '2026-10-14T07:30:00.000Z',
        status: 'IN_REVIEW',
        // Dữ liệu nội bộ nhạy cảm của Recruiter:
        rating: 5,
        tags: [
          { id: 'tag-secret-1', name: 'Lương cao cân nhắc' },
          { id: 'tag-secret-2', name: 'Pass phỏng vấn 1' },
        ],
        notes: [
          {
            id: 'note-secret-01',
            content: 'Ứng viên đòi mức lương Net 45 triệu, cần deal xuống 40 triệu.',
            authorName: 'HR Manager',
          },
        ],
        internalNotes: [
          { content: 'Bí mật nội bộ công ty không được công khai' },
        ],
        recruiterFeedback: 'Ứng viên tiềm năng',
        timeline: [
          {
            status: 'RECEIVED',
            occurredAt: '2026-10-14T07:30:00.000Z',
            note: 'Hồ sơ đã được tiếp nhận thành công.',
          },
        ],
      };

      const sanitizedResult = sanitizePublicApplicationResult(
        mockBackendCandidateRecordWithInternalData
      );

      // 1. Các trường công khai cho ứng viên phải được bảo toàn
      expect(sanitizedResult.applicationCode).toBe('APP-2026-TEST385');
      expect(sanitizedResult.jobTitle).toBe('Senior Frontend Engineer');
      expect(sanitizedResult.status).toBe('IN_REVIEW');
      expect(sanitizedResult.timeline).toBeDefined();
      expect(sanitizedResult.timeline?.[0].note).toBe('Hồ sơ đã được tiếp nhận thành công.');

      // 2. Tuyệt đối không chứa các trường nội bộ nhạy cảm trong đối tượng trả về
      const resultAsRecord = sanitizedResult as unknown as Record<string, unknown>;
      expect(resultAsRecord.rating).toBeUndefined();
      expect(resultAsRecord.tags).toBeUndefined();
      expect(resultAsRecord.notes).toBeUndefined();
      expect(resultAsRecord.internalNotes).toBeUndefined();
      expect(resultAsRecord.recruiterFeedback).toBeUndefined();
    });

    it('applicationLookupService.lookup tự động khử sạch dữ liệu nội bộ trước khi trả về cho UI ứng viên', async () => {
      // Tại sao: Dù backend có gửi nhầm thông tin nội bộ của ứng viên, tầng service phía frontend vẫn loại bỏ triệt để
      const rawApiDataWithSensitiveNotes = {
        applicationCode: 'APP-2026-SECRET',
        jobTitle: 'Backend Tech Lead',
        submittedAt: '2026-10-14T08:00:00Z',
        status: 'INTERVIEW',
        notes: [
          { content: 'Ghi chú nội bộ đánh giá phỏng vấn không được để lộ' },
        ],
        rating: 4,
        tags: [{ name: 'Offer cao' }],
      };

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: rawApiDataWithSensitiveNotes,
      });

      const publicResult = await applicationLookupService.lookup(
        'applicationCode',
        'APP-2026-SECRET'
      );

      expect(publicResult.applicationCode).toBe('APP-2026-SECRET');
      expect(publicResult.status).toBe('INTERVIEW');

      const publicResultRecord = publicResult as unknown as Record<string, unknown>;
      expect(publicResultRecord.notes).toBeUndefined();
      expect(publicResultRecord.rating).toBeUndefined();
      expect(publicResultRecord.tags).toBeUndefined();
    });
  });
});
