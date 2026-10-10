import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import {
  competencyService,
  validateCriteriaWeight,
  type SaveCompetencyFrameworkPayload,
} from '../src/services/competencyService';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('competencyService - API kết nối Khung Năng Lực (Jira TKNHTTDNB1-216 / S2-06)', () => {
  // AC1: getCompetencyFramework(positionId)
  describe('getCompetencyFramework(positionId)', () => {
    it('lấy cấu hình khung năng lực và tiêu chí đánh giá của chức danh thành công', async () => {
      const mockResponse = {
        position: {
          id: 'pos-frontend-lead',
          code: 'FE_LEAD',
          name: 'Trưởng nhóm Frontend',
          level: 'LEAD',
          active: true,
        },
        framework: {
          id: 'framework-fe',
          code: 'FE_FRAMEWORK',
          name: 'Khung năng lực Frontend',
        },
        criteria: [
          { id: 'crit-1', name: 'React & TypeScript', description: 'Chuyên môn', weight: 60, sortOrder: 1 },
          { id: 'crit-2', name: 'Quản lý nhóm', description: 'Leadership', weight: 40, sortOrder: 2 },
        ],
      };

      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await competencyService.getCompetencyFramework('pos-frontend-lead');

      expect(getSpy).toHaveBeenCalledWith('/positions/pos-frontend-lead/evaluation-criteria');
      expect(result.position.code).toBe('FE_LEAD');
      expect(result.criteria).toHaveLength(2);
    });

    it('bắt lỗi và thông báo thân thiện khi không tìm thấy chức danh', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404, data: { message: 'Chức danh không tồn tại' } },
      });

      await expect(competencyService.getCompetencyFramework('invalid-id')).rejects.toThrow(
        'Chức danh không tồn tại',
      );
    });
  });

  // AC2: saveCompetencyFramework(data) và Validation tổng trọng số 100%
  describe('saveCompetencyFramework(data) & Client Validation', () => {
    it('chặn gọi API và ném lỗi ngay tại client khi danh sách tiêu chí rỗng', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post');

      const payload: SaveCompetencyFrameworkPayload = {
        code: 'FRAMEWORK_TEST',
        name: 'Khung năng lực kiểm thử',
        status: 'ACTIVE',
        criteria: [],
      };

      await expect(competencyService.saveCompetencyFramework(payload)).rejects.toThrow(
        'Khung năng lực phải có ít nhất 1 tiêu chí đánh giá.',
      );
      expect(postSpy).not.toHaveBeenCalled();
    });

    it('chặn gọi API và ném lỗi ngay tại client khi tổng trọng số khác 100% (còn thiếu)', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post');

      const payload: SaveCompetencyFrameworkPayload = {
        code: 'FRAMEWORK_TEST',
        name: 'Khung năng lực kiểm thử',
        status: 'ACTIVE',
        criteria: [
          { name: 'Tiêu chí 1', weight: 40 },
          { name: 'Tiêu chí 2', weight: 45 },
        ], // Tổng 85%
      };

      await expect(competencyService.saveCompetencyFramework(payload)).rejects.toThrow(
        'Tổng trọng số của bộ tiêu chí phải bằng đúng 100% trước khi lưu (hiện tại: 85%).',
      );
      expect(postSpy).not.toHaveBeenCalled();
    });

    it('chặn gọi API và ném lỗi ngay tại client khi tổng trọng số khác 100% (vượt quá)', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post');

      const payload: SaveCompetencyFrameworkPayload = {
        code: 'FRAMEWORK_TEST',
        name: 'Khung năng lực kiểm thử',
        status: 'ACTIVE',
        criteria: [
          { name: 'Tiêu chí 1', weight: 60 },
          { name: 'Tiêu chí 2', weight: 50 },
        ], // Tổng 110%
      };

      await expect(competencyService.saveCompetencyFramework(payload)).rejects.toThrow(
        'Tổng trọng số của bộ tiêu chí phải bằng đúng 100% trước khi lưu (hiện tại: 110%).',
      );
      expect(postSpy).not.toHaveBeenCalled();
    });

    it('gọi API POST tạo mới khi tổng trọng số đúng 100% và id là null/undefined', async () => {
      const mockCreated = {
        id: 'new-framework-123',
        code: 'FRAMEWORK_QA',
        name: 'Khung năng lực QA',
        description: 'Mô tả QA',
        status: 'ACTIVE' as const,
        criteria: [
          { id: 'c1', name: 'Automation Test', description: null, weight: 50, sortOrder: 1 },
          { id: 'c2', name: 'Manual Test', description: null, weight: 50, sortOrder: 2 },
        ],
        positions: [],
      };

      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: mockCreated,
      });

      const payload: SaveCompetencyFrameworkPayload = {
        code: 'framework_qa',
        name: 'Khung năng lực QA',
        description: 'Mô tả QA',
        status: 'ACTIVE',
        criteria: [
          { name: 'Automation Test', weight: 50 },
          { name: 'Manual Test', weight: 50 },
        ],
      };

      const result = await competencyService.saveCompetencyFramework(payload);

      expect(postSpy).toHaveBeenCalledWith('/competency-frameworks', {
        code: 'FRAMEWORK_QA',
        name: 'Khung năng lực QA',
        description: 'Mô tả QA',
        status: 'ACTIVE',
        criteria: [
          { name: 'Automation Test', description: null, weight: 50 },
          { name: 'Manual Test', description: null, weight: 50 },
        ],
      });
      expect(result.id).toBe('new-framework-123');
    });

    it('gọi API PUT cập nhật khi có id và đồng bộ danh sách positionIds', async () => {
      const mockUpdated = {
        id: 'framework-existing',
        code: 'DEV_SR',
        name: 'Senior Dev',
        description: null,
        status: 'ACTIVE' as const,
        criteria: [
          { id: 'c1', name: 'Architecture', description: null, weight: 100, sortOrder: 1 },
        ],
        positions: [{ id: 'pos-1', code: 'P1', name: 'Pos 1', level: 'SR', active: true }],
      };

      const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
        data: mockUpdated,
      });
      const assignSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({ data: {} });
      const getDetailSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: {
          ...mockUpdated,
          positions: [
            { id: 'pos-1', code: 'P1', name: 'Pos 1', level: 'SR', active: true },
            { id: 'pos-2', code: 'P2', name: 'Pos 2', level: 'SR', active: true },
          ],
        },
      });

      const payload: SaveCompetencyFrameworkPayload = {
        id: 'framework-existing',
        code: 'DEV_SR',
        name: 'Senior Dev',
        status: 'ACTIVE',
        criteria: [{ name: 'Architecture', weight: 100 }],
        positionIds: ['pos-1', 'pos-2'],
      };

      const result = await competencyService.saveCompetencyFramework(payload);

      expect(putSpy).toHaveBeenCalledWith('/competency-frameworks/framework-existing', {
        code: 'DEV_SR',
        name: 'Senior Dev',
        description: null,
        status: 'ACTIVE',
        criteria: [{ name: 'Architecture', description: null, weight: 100 }],
      });
      expect(assignSpy).toHaveBeenCalledWith('/positions/pos-2/competency-framework', {
        frameworkId: 'framework-existing',
      });
      expect(getDetailSpy).toHaveBeenCalledWith('/competency-frameworks/framework-existing');
      expect(result.positions).toHaveLength(2);
    });
  });

  describe('validateCriteriaWeight helper function', () => {
    it('chấp nhận bộ trọng số đúng 100% kể cả số thập phân', () => {
      expect(() =>
        validateCriteriaWeight([
          { weight: 33.34 },
          { weight: 33.33 },
          { weight: 33.33 },
        ]),
      ).not.toThrow();
    });

    it('từ chối khi trọng số không đạt 100%', () => {
      expect(() => validateCriteriaWeight([{ weight: 99.9 }])).toThrow();
      expect(() => validateCriteriaWeight([{ weight: 100.1 }])).toThrow();
    });
  });
});
