import React, { useState, useMemo } from 'react';
import { differenceInDays, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { AlertCircle, X, Edit, Copy } from 'lucide-react';
import type { Requisition, Position, Department } from '../../services/business.service';

export interface RequisitionListProps {
  items: Requisition[];
  positions: Position[];
  departments: Department[];
  editable: boolean;
  onEdit: (item: Requisition) => void;
  onClone: (item: Requisition) => void;
}

export const RequisitionList: React.FC<RequisitionListProps> = ({
  items,
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

  const clearFilters = () => {
    setFilterStatus('');
    setFilterDepartment('');
    setDateFrom('');
    setDateTo('');
  };

  const today = useMemo(() => startOfDay(new Date()), []);
  const statuses = useMemo(() => Array.from(new Set(items.map(i => i.status))), [items]);

  const filteredData = useMemo(() => {
    return items.filter((req) => {
      if (filterStatus && req.status !== filterStatus) return false;
      if (filterDepartment && req.departmentId !== filterDepartment) return false;
      
      if (dateFrom || dateTo) {
        if (!req.neededBy) return false;
        const target = parseISO(req.neededBy);
        if (dateFrom && isBefore(target, parseISO(dateFrom))) return false;
        if (dateTo && isAfter(target, parseISO(dateTo))) return false;
      }
      return true;
    }).map((req) => {
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
  }, [items, filterStatus, filterDepartment, dateFrom, dateTo, today, positions, departments]);

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
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
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

      <div className="overflow-x-auto">
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
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={editable ? 8 : 7} className="px-4 py-8 text-center text-slate-500">
                  Không tìm thấy yêu cầu tuyển dụng nào.
                </td>
              </tr>
            ) : (
              filteredData.map((req) => (
                <tr 
                  key={req.id} 
                  className={`hover:bg-slate-50 transition-colors ${req.isOverdue ? 'bg-red-50/50' : 'bg-white'}`}
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
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                          onClick={() => onEdit(req)}
                          title="Sửa nháp"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
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
