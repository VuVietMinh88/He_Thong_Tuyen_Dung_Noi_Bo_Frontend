import { useState, useEffect, useCallback, type FC } from 'react';
import {
  competencyService,
  type CompetencyFramework,
  type CompetencyFrameworkSummary,
} from '../../services/competencyService';
import { usePermission } from '../../hooks/usePermission';
import CompetencyFrameworkFormModal from './CompetencyFrameworkFormModal';

export const CompetencyFrameworkList: FC = () => {
  const { permissions } = usePermission();
  const canWrite = permissions.includes('ORGANIZATION_WRITE_ALL');

  const [frameworks, setFrameworks] = useState<CompetencyFrameworkSummary[]>([]);
  const [frameworkDetailsMap, setFrameworkDetailsMap] = useState<Record<string, CompetencyFramework>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT'>('ALL');

  // Trạng thái modal Form
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFrameworkId, setEditingFrameworkId] = useState<string | null>(null);

  // Trạng thái modal xem chi tiết
  const [viewingFramework, setViewingFramework] = useState<CompetencyFramework | null>(null);

  // Tải danh sách khung năng lực
  const fetchFrameworks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await competencyService.getFrameworks(0);
      setFrameworks(response.items);

      // Tải chi tiết positions của từng framework để hiển thị badges chức danh
      const detailsList = await Promise.allSettled(
        response.items.map((item) => competencyService.getFrameworkById(item.id)),
      );

      const map: Record<string, CompetencyFramework> = {};
      detailsList.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          map[result.value.id] = result.value;
        }
      });
      setFrameworkDetailsMap(map);
    } catch (loadError: unknown) {
      setErrorMessage(
        loadError instanceof Error ? loadError.message : 'Không thể tải danh sách khung năng lực.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFrameworks();
  }, [fetchFrameworks]);


  // Lọc dữ liệu
  const filteredFrameworks = frameworks.filter((fw) => {
    const matchesSearch =
      fw.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fw.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || fw.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Số liệu thống kê tóm tắt
  const totalCount = frameworks.length;
  const activeCount = frameworks.filter((f) => f.status === 'ACTIVE').length;
  const draftCount = frameworks.filter((f) => f.status === 'DRAFT').length;

  const handleOpenCreateModal = () => {
    setEditingFrameworkId(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (id: string) => {
    setEditingFrameworkId(id);
    setIsFormModalOpen(true);
  };

  const handleOpenViewModal = async (id: string) => {
    try {
      const detail = frameworkDetailsMap[id] ?? (await competencyService.getFrameworkById(id));
      setViewingFramework(detail);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải chi tiết khung năng lực.',
      );
    }
  };

  const handleFormSuccess = () => {
    void fetchFrameworks();
  };

  return (
    <div className="space-y-6">
      {/* Header & Thống kê */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý Khung Năng Lực
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Thiết lập tiêu chuẩn năng lực, bộ tiêu chí đánh giá trọng số 100% và liên kết chức danh tuyển dụng.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-98"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tạo khung năng lực mới</span>
          </button>
        )}
      </div>

      {/* Thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tổng số khung năng lực</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase">Đang áp dụng (Active)</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-800">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-700 uppercase">Bản nháp (Draft)</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-800">{draftCount}</p>
        </div>
      </div>

      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã khung năng lực..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pr-4 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <svg
            className="absolute top-2.5 left-3 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Trạng thái:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Áp dụng
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DRAFT')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'DRAFT'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bản nháp
            </button>
          </div>
        </div>
      </div>

      {/* Bảng danh sách Khung Năng Lực */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center space-x-2 text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>Đang tải danh sách khung năng lực...</span>
          </div>
        ) : filteredFrameworks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm font-medium text-slate-600">Không tìm thấy khung năng lực nào.</p>
            {searchTerm && <p className="text-xs text-slate-400">Thử tìm kiếm với từ khóa khác.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Mã & Tên khung năng lực</th>
                  <th scope="col" className="px-4 py-3.5">Trạng thái</th>
                  <th scope="col" className="px-4 py-3.5">Số tiêu chí</th>
                  <th scope="col" className="px-5 py-3.5">Chức danh áp dụng</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFrameworks.map((fw) => {
                  const details = frameworkDetailsMap[fw.id];
                  const positions = details?.positions ?? [];

                  return (
                    <tr key={fw.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                            {fw.code}
                          </span>
                          <span className="font-semibold text-slate-900">{fw.name}</span>
                        </div>
                        {fw.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500 max-w-md">
                            {fw.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {fw.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            Đang áp dụng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                            Bản nháp
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {fw.criterionCount} tiêu chí
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {positions.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">
                              Chưa gắn chức danh
                            </span>
                          ) : (
                            positions.slice(0, 3).map((pos) => (
                              <span
                                key={pos.id}
                                className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                              >
                                {pos.name}
                              </span>
                            ))
                          )}
                          {positions.length > 3 && (
                            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                              +{positions.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(fw.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            title="Xem chi tiết bộ tiêu chí"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(fw.id)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                            >
                              Sửa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form Thêm/Sửa */}
      <CompetencyFrameworkFormModal
        isOpen={isFormModalOpen}
        frameworkId={editingFrameworkId}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Modal Xem chi tiết bộ tiêu chí */}
      {viewingFramework && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {viewingFramework.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{viewingFramework.name}</h3>
                </div>
                {viewingFramework.description && (
                  <p className="mt-1 text-xs text-slate-500">{viewingFramework.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewingFramework(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chức danh đang áp dụng ({viewingFramework.positions.length}):
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingFramework.positions.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">Chưa gắn chức danh nào</span>
                  ) : (
                    viewingFramework.positions.map((p) => (
                      <span key={p.id} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                        {p.name} ({p.level || p.code})
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Bộ tiêu chí & Trọng số đánh giá:
                </h4>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {viewingFramework.criteria.map((c, i) => (
                    <div key={c.id || i} className="flex items-center justify-between p-3 text-xs">
                      <div className="flex-1 pr-4">
                        <span className="font-semibold text-slate-800">
                          #{i + 1}. {c.name}
                        </span>
                        {c.description && <p className="text-slate-500 mt-0.5">{c.description}</p>}
                      </div>
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {c.weight}%
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-slate-50 p-3 text-xs font-bold text-slate-800 rounded-b-xl">
                    <span>Tổng trọng số:</span>
                    <span className="text-emerald-700 font-mono text-sm">
                      {viewingFramework.criteria.reduce((s, c) => s + Number(c.weight), 0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingFramework(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetencyFrameworkList;
