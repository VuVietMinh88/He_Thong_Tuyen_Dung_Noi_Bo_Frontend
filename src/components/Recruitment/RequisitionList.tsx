import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { AlertCircle, X, Edit, Copy, Inbox, RefreshCcw } from 'lucide-react';
import { businessService, type Requisition, type Position, type Department } from '../../services/business.service';

export interface RequisitionListProps {
  positions: Position[];
  departments: Department[];
  editable: boolean;
  onEdit: (item: Requisition) => void;
  onClone: (item: Requisition) => void;
}

const STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'OPEN', 'CLOSED', 'CANCELLED'];

export const RequisitionList: React.FC<RequisitionListProps> = ({
  positions,
  departments,
  editable,
  onEdit,
  onClone,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [data, setData] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequisitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessService.getRequisitions({
        status: filterStatus,
        departmentId: filterDepartment,
        startDate: dateFrom,
        endDate: dateTo,
      });
      setData(response.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRequisitions();
    }, 500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterDepartment, dateFrom, dateTo]);

  const clearFilters = () => {
    setFilterStatus('');
    setFilterDepartment('');
    setDateFrom('');
    setDateTo('');
  };

  const today = useMemo(() => startOfDay(new Date()), []);

  const processedData = useMemo(() => {
    return data.map((req) => {
      let openDays: number | string = '-';
      let daysLeft: number | string = '-';
      let isOverdue = false;

      // Calculate days since created
      if (req.createdAt) {
        openDays = differenceInDays(today, parseISO(req.createdAt));
      }
      
      // Calculate days left to neededBy
      if (req.neededBy) {
        const left = differenceInDays(parseISO(req.neededBy), today);
        daysLeft = left;
        isOverdue = left < 0;
      }

      return {
        ...req,
        openDays,
        daysLeft,
        isOverdue,
        positionName: positions.find(p => p.id === req.positionId)?.name ?? req.positionId,
        departmentName: departments.find(d => d.id === req.departmentId)?.name ?? req.departmentId,
      };
    });
  }, [data, today, positions, departments]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Trạng thái</label>
            <select 
              className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phòng ban</label>
            <select 
              className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border text-sm"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Ngày cần người (Từ - Đến)</label>
            <div className="flex items-center space-x-2">
              <input 
                type="date" 
                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date" 
                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {(filterStatus || filterDepartment || dateFrom || dateTo) && (
          <div className="mt-3 flex justify-end">
            <button 
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto relative min-h-[200px]">
        {error && (
          <div className="absolute inset-0 z-10 bg-white/90 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Không thể tải dữ liệu</h3>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button 
              onClick={fetchRequisitions}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              <RefreshCcw className="w-4 h-4" /> Thử lại
            </button>
          </div>
        )}

        <table className="min-w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">Chức danh</th>
              <th className="px-4 py-3 font-medium">Phòng ban</th>
              <th className="px-4 py-3 font-medium">Số lượng</th>
              <th className="px-4 py-3 font-medium">Lý do</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium text-right">Số ngày còn lại</th>
              {editable && <th className="px-4 py-3 font-medium text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              // Skeleton Loading
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-3/4"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-8"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-5 bg-slate-200 rounded-full w-16"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  {editable && <td className="px-4 py-4"><div className="h-6 bg-slate-200 rounded w-12 ml-auto"></div></td>}
                </tr>
              ))
            ) : processedData.length === 0 && !error ? (
              // Empty State
              <tr>
                <td colSpan={editable ? 8 : 7} className="px-4 py-12">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <Inbox className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">Không có dữ liệu</p>
                    <p className="text-xs mt-1">Không tìm thấy yêu cầu tuyển dụng nào phù hợp với bộ lọc.</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              processedData.map((req) => (
                <tr 
                  key={req.id} 
                  className={`hover:bg-slate-50 transition-colors ${req.isOverdue ? 'bg-red-50' : 'bg-white'}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5" title={req.isOverdue ? "Quá hạn" : ""}>
                      {req.isOverdue && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                      <span className={`font-medium ${req.isOverdue ? 'text-red-700' : 'text-slate-900'}`}>{req.positionName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{req.departmentName}</td>
                  <td className="px-4 py-3">{req.headcount}</td>
                  <td className="px-4 py-3 text-xs">
                    {req.reason === 'NEW_HEADCOUNT' ? 'Tăng định biên' : 'Thay thế'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${
                      req.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <div>{req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '-'}</div>
                    {req.openDays !== '-' && <div className="text-[11px] mt-0.5 text-slate-400">({req.openDays} ngày mở)</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {req.neededBy ? (
                      <span className={`font-medium ${req.isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                        {req.daysLeft} ngày
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  {editable && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'APPROVED' && (
                          <Link
                            to={`/job-postings/create?requisitionId=${req.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                            title="Soạn tin tuyển dụng từ yêu cầu đã duyệt này"
                          >
                            ✍️ Soạn tin
                          </Link>
                        )}
                        <button 
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          onClick={() => onEdit(req)}
                          title="Sửa nháp"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          onClick={() => onClone(req)}
                          title="Sao chép"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequisitionList;
