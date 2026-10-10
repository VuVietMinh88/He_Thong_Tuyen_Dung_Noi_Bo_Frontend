import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import { businessService } from '../src/services/business.service';
import {
  calculateTotalWeight,
  distributeWeightsEqually,
  isWeightValid,
} from '../src/components/Recruitment/competencyFramework.types';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Competency Framework Weight Calculation & Validation (User Story S2-06)', () => {
  it('tính chính xác tổng trọng số real-time từ danh sách các tiêu chí', () => {
    const criteria = [
      { weight: 30 },
      { weight: 40 },
      { weight: 30 },
    ];
    expect(calculateTotalWeight(criteria)).toBe(100);
  });

  it('xử lý chính xác giá trị trọng số dạng chuỗi số và số thập phân', () => {
    const criteriaWithStrings = [
      { weight: '33.33' },
      { weight: '33.33' },
      { weight: '33.34' },
    ];
    expect(calculateTotalWeight(criteriaWithStrings)).toBe(100);
  });

  it('xử lý bỏ qua các giá trị rỗng hoặc không hợp lệ khi người dùng đang gõ', () => {
    const criteriaDraft = [
      { weight: '' },
      { weight: '45.5' },
      { weight: 'invalid' },
      { weight: 14.5 },
    ];
    expect(calculateTotalWeight(criteriaDraft)).toBe(60);
  });

  it('xác thực đúng ràng buộc 100% trọng số (AC2)', () => {
    // Trường hợp đạt chuẩn 100%
    expect(isWeightValid(100)).toBe(true);
    expect(isWeightValid(100.0000000001)).toBe(true);

    // Trường hợp thiếu (< 100%)
    expect(isWeightValid(99.9)).toBe(false);
    expect(isWeightValid(0)).toBe(false);
    expect(isWeightValid(85)).toBe(false);

    // Trường hợp vượt quá (> 100%)
    expect(isWeightValid(100.5)).toBe(false);
    expect(isWeightValid(105)).toBe(false);
    expect(isWeightValid(150)).toBe(false);
  });

  it('hỗ trợ tự động phân bổ đều 100% trọng số cho N tiêu chí bất kỳ', () => {
    // 3 tiêu chí: tổng phải đúng 100
    const weights3 = distributeWeightsEqually(3);
    expect(weights3).toHaveLength(3);
    expect(calculateTotalWeight(weights3.map((w) => ({ weight: w })))).toBe(100);

    // 4 tiêu chí: mỗi tiêu chí 25%
    const weights4 = distributeWeightsEqually(4);
    expect(weights4).toEqual([25, 25, 25, 25]);
    expect(calculateTotalWeight(weights4.map((w) => ({ weight: w })))).toBe(100);

    // 7 tiêu chí: tổng luôn chính xác 100
    const weights7 = distributeWeightsEqually(7);
    expect(weights7).toHaveLength(7);
    expect(calculateTotalWeight(weights7.map((w) => ({ weight: w })))).toBe(100);
  });
});

describe('Competency Framework Service & Position Assignment API Integration (AC3)', () => {
  it('gửi payload lưu khung năng lực và danh sách tiêu chí chuẩn xác đến Backend', async () => {
    const mockFrameworkResponse = {
      id: 'framework-tech-sr',
      code: 'DEV_SENIOR',
      name: 'Khung năng lực Senior Developer',
      description: 'Mô tả tiêu chuẩn năng lực',
      status: 'ACTIVE' as const,
      criteria: [
        { id: 'crit-1', name: 'Clean Architecture', description: 'Kiến trúc', weight: 60, sortOrder: 1 },
        { id: 'crit-2', name: 'Code Review & Mentoring', description: 'Kỹ năng mềm', weight: 40, sortOrder: 2 },
      ],
      positions: [],
    };

    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
      data: mockFrameworkResponse,
    });

    const payload = {
      code: 'DEV_SENIOR',
      name: 'Khung năng lực Senior Developer',
      description: 'Mô tả tiêu chuẩn năng lực',
      status: 'ACTIVE' as const,
      criteria: [
        { name: 'Clean Architecture', description: 'Kiến trúc', weight: 60 },
        { name: 'Code Review & Mentoring', description: 'Kỹ năng mềm', weight: 40 },
      ],
    };

    const result = await businessService.saveFramework(null, payload);

    expect(postSpy).toHaveBeenCalledWith('/competency-frameworks', payload);
    expect(result.id).toBe('framework-tech-sr');
    expect(result.criteria).toHaveLength(2);
  });

  it('gán và gỡ bỏ liên kết chức danh với khung năng lực (AC3)', async () => {
    const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
      data: { id: 'pos-1', competencyFrameworkId: 'framework-1' },
    });
    const deleteSpy = vi.spyOn(axiosClient, 'delete').mockResolvedValueOnce({
      data: { id: 'pos-2', competencyFrameworkId: null },
    });

    await businessService.assignPositionFramework('pos-1', 'framework-1');
    expect(putSpy).toHaveBeenCalledWith('/positions/pos-1/competency-framework', {
      frameworkId: 'framework-1',
    });

    await businessService.removePositionFramework('pos-2');
    expect(deleteSpy).toHaveBeenCalledWith('/positions/pos-2/competency-framework');
  });
});
