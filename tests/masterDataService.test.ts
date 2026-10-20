import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import axiosClient from '../src/utils/axiosClient';
import {
  masterDataService,
  generateCatalogCode,
  normalizeMasterDataType,
  handleMasterDataApiError,
  type RecruitmentCatalogRawItem,
} from '../src/services/masterDataService';

afterEach(() => {
  vi.restoreAllMocks();
});

const mockRawSources: RecruitmentCatalogRawItem[] = [
  {
    id: 'src-1',
    type: 'CANDIDATE_SOURCE',
    code: 'LINKEDIN',
    name: 'LinkedIn',
    sortOrder: 0,
    active: true,
  },
  {
    id: 'src-2',
    type: 'CANDIDATE_SOURCE',
    code: 'FACEBOOK',
    name: 'Facebook',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'src-3',
    type: 'CANDIDATE_SOURCE',
    code: 'REFERRAL',
    name: 'Nhân viên giới thiệu',
    sortOrder: 2,
    active: false,
  },
];

describe('Master Data Service API Integration (Task Jira TKNHTTDNB1-232 / User Story S2-08)', () => {
  // AC1: getMasterData(type)
  describe('AC1: masterDataService.getMasterData(type)', () => {
    it('gọi đúng endpoint GET /recruitment-catalogs/{type}/items và chuẩn hóa dữ liệu', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockRawSources,
      });

      const res = await masterDataService.getMasterData('CANDIDATE_SOURCE');

      expect(getSpy).toHaveBeenCalledWith('/recruitment-catalogs/CANDIDATE_SOURCE/items', {
        params: undefined,
      });
      expect(res).toHaveLength(3);
      expect(res[0].code).toBe('LINKEDIN');
      expect(res[0].name).toBe('LinkedIn');
      expect(res[0].order).toBe(0);
      expect(res[0].isActive).toBe(true);
      expect(res[2].isActive).toBe(false);
    });

    it('tự động chuẩn hóa alias loại danh mục JOB_LOCATION sang WORK_LOCATION', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: [
          {
            id: 'loc-1',
            type: 'WORK_LOCATION',
            code: 'HA_NOI',
            name: 'Hà Nội',
            sortOrder: 0,
            active: true,
          },
        ],
      });

      const res = await masterDataService.getMasterData('JOB_LOCATION');
      expect(getSpy).toHaveBeenCalledWith('/recruitment-catalogs/WORK_LOCATION/items', {
        params: undefined,
      });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Hà Nội');
    });

    it('tự động chuẩn hóa alias loại danh mục JOB_TYPE sang EMPLOYMENT_TYPE', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: [],
      });

      await masterDataService.getMasterData('JOB_TYPE');
      expect(getSpy).toHaveBeenCalledWith('/recruitment-catalogs/EMPLOYMENT_TYPE/items', {
        params: undefined,
      });
    });
  });

  // AC1: saveMasterData(type, data)
  describe('AC1: masterDataService.saveMasterData(type, data)', () => {
    it('gửi request POST với body chuẩn { code, name, active } khi tạo mới danh mục', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          id: 'new-id',
          type: 'CANDIDATE_SOURCE',
          code: 'HEADHUNT',
          name: 'Headhunt',
          sortOrder: 3,
          active: true,
        },
      });

      const result = await masterDataService.saveMasterData('CANDIDATE_SOURCE', {
        code: 'HEADHUNT',
        name: 'Headhunt',
        isActive: true,
      });

      expect(postSpy).toHaveBeenCalledWith('/recruitment-catalogs/CANDIDATE_SOURCE/items', {
        code: 'HEADHUNT',
        name: 'Headhunt',
        active: true,
      });
      expect(result.id).toBe('new-id');
      expect(result.code).toBe('HEADHUNT');
    });

    it('tự động sinh mã code chuẩn khi không nhập code', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          id: 'auto-id',
          type: 'WORK_LOCATION',
          code: 'HO_CHI_MINH',
          name: 'Hồ Chí Minh',
          sortOrder: 1,
          active: true,
        },
      });

      await masterDataService.saveMasterData('WORK_LOCATION', {
        name: 'Hồ Chí Minh',
        isActive: true,
      });

      expect(postSpy).toHaveBeenCalledWith('/recruitment-catalogs/WORK_LOCATION/items', {
        code: 'HO_CHI_MINH',
        name: 'Hồ Chí Minh',
        active: true,
      });
    });

    it('gửi request PUT khi cập nhật mục danh mục đã có id', async () => {
      const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
        data: {
          id: 'src-1',
          type: 'CANDIDATE_SOURCE',
          code: 'LINKEDIN_PRO',
          name: 'LinkedIn Pro',
          sortOrder: 0,
          active: false,
        },
      });

      const updated = await masterDataService.saveMasterData('CANDIDATE_SOURCE', {
        id: 'src-1',
        code: 'LINKEDIN_PRO',
        name: 'LinkedIn Pro',
        isActive: false,
      });

      expect(putSpy).toHaveBeenCalledWith('/recruitment-catalogs/CANDIDATE_SOURCE/items/src-1', {
        code: 'LINKEDIN_PRO',
        name: 'LinkedIn Pro',
        active: false,
      });
      expect(updated.isActive).toBe(false);
    });

    it('ném lỗi validation client khi tên danh mục rỗng', async () => {
      await expect(
        masterDataService.saveMasterData('CANDIDATE_SOURCE', {
          name: '   ',
        }),
      ).rejects.toThrow('Tên giá trị danh mục không được để trống.');
    });
  });

  // AC1 & AC2: deleteMasterData(type, id) & Bắt lỗi ràng buộc tham chiếu
  describe('AC1 & AC2: masterDataService.deleteMasterData và Xử lý chặn xóa khi tham chiếu', () => {
    it('gửi request DELETE /recruitment-catalogs/{type}/items/{id} khi xóa thành công', async () => {
      const deleteSpy = vi.spyOn(axiosClient, 'delete').mockResolvedValueOnce({
        data: undefined,
      });

      await masterDataService.deleteMasterData('CANDIDATE_SOURCE', 'src-del-123');
      expect(deleteSpy).toHaveBeenCalledWith(
        '/recruitment-catalogs/CANDIDATE_SOURCE/items/src-del-123',
      );
    });

    it('bắt lỗi HTTP 409 và ném thông báo cụ thể khi dữ liệu đang được tham chiếu', async () => {
      const err = new AxiosError('Conflict');
      err.response = {
        data: {
          code: 'RECRUITMENT_CATALOG_ITEM_IN_USE',
          message:
            'Giá trị danh mục đang được dữ liệu khác sử dụng nên không thể xóa. Hãy chuyển giá trị sang ngừng sử dụng (active = false).',
        },
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: {} as any,
      };

      vi.spyOn(axiosClient, 'delete').mockRejectedValueOnce(err);

      await expect(
        masterDataService.deleteMasterData('CANDIDATE_SOURCE', 'src-1'),
      ).rejects.toThrow(
        'Giá trị danh mục đang được dữ liệu khác sử dụng nên không thể xóa. Hãy chuyển giá trị sang ngừng sử dụng (active = false).',
      );
    });
  });

  // AC2: reorderMasterData(type, itemIds) - Sắp xếp thứ tự
  describe('AC2: masterDataService.reorderMasterData(type, itemIds)', () => {
    it('gửi request PUT /recruitment-catalogs/{type}/order với danh sách itemIds', async () => {
      const itemIds = ['src-2', 'src-1', 'src-3'];
      const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
        data: [
          { ...mockRawSources[1], sortOrder: 0 },
          { ...mockRawSources[0], sortOrder: 1 },
          { ...mockRawSources[2], sortOrder: 2 },
        ],
      });

      const reordered = await masterDataService.reorderMasterData('CANDIDATE_SOURCE', itemIds);

      expect(putSpy).toHaveBeenCalledWith('/recruitment-catalogs/CANDIDATE_SOURCE/order', {
        itemIds,
      });
      expect(reordered).toHaveLength(3);
      expect(reordered[0].id).toBe('src-2');
      expect(reordered[0].order).toBe(0);
      expect(reordered[1].id).toBe('src-1');
      expect(reordered[1].order).toBe(1);
    });
  });

  // Helpers: generateCatalogCode & normalizeMasterDataType
  describe('Helpers: generateCatalogCode & normalizeMasterDataType', () => {
    it('chuyển đổi chuỗi tiếng Việt có dấu sang mã code chuẩn hóa', () => {
      expect(generateCatalogCode('Nhân viên giới thiệu')).toBe('NHAN_VIEN_GIOI_THIEU');
      expect(generateCatalogCode('Không đạt chuyên môn')).toBe('KHONG_DAT_CHUYEN_MON');
      expect(generateCatalogCode('Đà Nẵng')).toBe('DA_NANG');
      expect(generateCatalogCode('Toàn thời gian (Full-time)')).toBe('TOAN_THOI_GIAN_FULL_TIME');
    });

    it('chuẩn hóa các loại danh mục alias', () => {
      expect(normalizeMasterDataType('JOB_LOCATION')).toBe('WORK_LOCATION');
      expect(normalizeMasterDataType('JOB_TYPE')).toBe('EMPLOYMENT_TYPE');
      expect(normalizeMasterDataType('CANDIDATE_SOURCE')).toBe('CANDIDATE_SOURCE');
    });
  });

  // Error handling: handleMasterDataApiError
  describe('Error handling: handleMasterDataApiError', () => {
    it('xử lý lỗi mất kết nối máy chủ', () => {
      const err = new AxiosError('Network Error');
      err.response = undefined;
      const res = handleMasterDataApiError(err, 'Lỗi');
      expect(res.message).toContain('Không thể kết nối đến máy chủ Backend');
    });

    it('xử lý lỗi 403 không có quyền', () => {
      const err = new AxiosError('Forbidden');
      err.response = { status: 403, data: {}, statusText: 'Forbidden', headers: {}, config: {} as any };
      const res = handleMasterDataApiError(err, 'Lỗi');
      expect(res.message).toContain('Bạn không có quyền');
    });
  });
});
