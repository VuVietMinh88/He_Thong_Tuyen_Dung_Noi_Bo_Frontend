import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileText,
  Clock,
  Eye,
  X,
  ShieldCheck,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import type { CandidateReferral, ReferralStatus } from '../../types/referral';
import { REFERRAL_STATUS_CONFIG, type ReferralStatusMetadata } from '../../types/referral';
import { formatVietnamDateTime } from '../../services/referralService';

export interface ReferralTrackingTableProps {
  referrals: CandidateReferral[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onAddNew?: () => void;
}

export const ReferralTrackingTable: React.FC<ReferralTrackingTableProps> = ({
  referrals,
  isLoading = false,
  onRefresh,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReferral, setSelectedReferral] = useState<CandidateReferral | null>(null);

  // Thống kê số lượng theo 4 trạng thái chuẩn
  const stats = useMemo(() => {
    const total = referrals.length;
    const received = referrals.filter((r) => r.status === 'RECEIVED').length;
    const inReview = referrals.filter((r) => r.status === 'IN_REVIEW').length;
    const interviewing = referrals.filter((r) => r.status === 'INTERVIEWING').length;
    const completed = referrals.filter((r) => r.status === 'COMPLETED').length;

    return { total, received, inReview, interviewing, completed };
  }, [referrals]);

  // Lọc danh sách hồ sơ
  const filteredReferrals = useMemo(() => {
    return referrals.filter((item) => {
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const lowerSearch = searchTerm.toLowerCase().trim();
      const matchSearch =
        !lowerSearch ||
        item.candidateName.toLowerCase().includes(lowerSearch) ||
        item.jobTitle.toLowerCase().includes(lowerSearch) ||
        item.candidateEmail.toLowerCase().includes(lowerSearch) ||
        item.departmentName.toLowerCase().includes(lowerSearch);

      return matchStatus && matchSearch;
    });
  }, [referrals, searchTerm, statusFilter]);

  // Render Badge trạng thái chuẩn hóa 4 mức
  const renderStatusBadge = (status: ReferralStatus) => {
    const meta: ReferralStatusMetadata =
      REFERRAL_STATUS_CONFIG[status] || REFERRAL_STATUS_CONFIG.RECEIVED;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.badgeClass} shadow-2xs`}
        title={meta.description}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
        <span>{meta.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Thẻ tóm tắt số liệu 4 mức trạng thái */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Tổng số */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === 'ALL'
              ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tất cả hồ sơ
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.total}</p>
        </div>

        {/* 1. Đã nhận */}
        <div
          onClick={() => setStatusFilter('RECEIVED')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === 'RECEIVED'
              ? 'border-blue-500 bg-blue-50/50 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              Đã nhận
            </p>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <p className="mt-1 text-2xl font-black text-blue-900">{stats.received}</p>
        </div>

        {/* 2. Đang xem xét */}
        <div
          onClick={() => setStatusFilter('IN_REVIEW')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === 'IN_REVIEW'
              ? 'border-amber-500 bg-amber-50/50 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              Đang xem xét
            </p>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <p className="mt-1 text-2xl font-black text-amber-900">{stats.inReview}</p>
        </div>

        {/* 3. Mời phỏng vấn */}
        <div
          onClick={() => setStatusFilter('INTERVIEWING')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === 'INTERVIEWING'
              ? 'border-purple-500 bg-purple-50/50 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
              Mời phỏng vấn
            </p>
            <span className="h-2 w-2 rounded-full bg-purple-500" />
          </div>
          <p className="mt-1 text-2xl font-black text-purple-900">{stats.interviewing}</p>
        </div>

        {/* 4. Kết thúc */}
        <div
          onClick={() => setStatusFilter('COMPLETED')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all col-span-2 sm:col-span-1 ${
            statusFilter === 'COMPLETED'
              ? 'border-slate-500 bg-slate-100/70 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Kết thúc
            </p>
            <span className="h-2 w-2 rounded-full bg-slate-400" />
          </div>
          <p className="mt-1 text-2xl font-black text-slate-800">{stats.completed}</p>
        </div>
      </div>

      {/* 2. Thanh tìm kiếm & Bộ lọc trạng thái */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tìm kiếm */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên ứng viên, vị trí, email..."
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Bộ lọc trạng thái & Nút thao tác */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">Tất cả trạng thái ({referrals.length})</option>
            <option value="RECEIVED">Đã nhận ({stats.received})</option>
            <option value="IN_REVIEW">Đang xem xét ({stats.inReview})</option>
            <option value="INTERVIEWING">Mời phỏng vấn ({stats.interviewing})</option>
            <option value="COMPLETED">Kết thúc ({stats.completed})</option>
          </select>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Làm mới danh sách"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          )}

          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Giới thiệu mới</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Bảng danh sách hồ sơ */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Ứng viên được giới thiệu
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Vị trí ứng tuyển &amp; Phòng ban
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Ngày nộp (Giờ VN)
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Nguồn hồ sơ
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Trạng thái tổng quát
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {/* SKELETON LOADING STATE */}
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 w-32 rounded-md bg-slate-200 mb-1.5" />
                      <div className="h-3 w-44 rounded-md bg-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-48 rounded-md bg-slate-200 mb-1.5" />
                      <div className="h-3 w-32 rounded-md bg-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-3.5 w-24 rounded-md bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-5 w-24 rounded-md bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-6 w-20 rounded-full bg-slate-200" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="ml-auto h-7 w-12 rounded-lg bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : filteredReferrals.length === 0 ? (
                /* EMPTY STATE */
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 text-2xl mb-3 shadow-xs">
                      🤝
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'Không tìm thấy hồ sơ nào phù hợp'
                        : 'Bạn chưa có hồ sơ giới thiệu nào'}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'Không có kết quả khớp với điều kiện lọc hiện tại. Vui lòng thử đổi từ khóa hoặc đặt lại bộ lọc.'
                        : 'Giới thiệu đồng nghiệp hoặc bạn bè tài năng vào các vị trí tuyển dụng để cùng đồng hành phát triển và nhận thưởng giới thiệu hấp dẫn.'}
                    </p>

                    {onAddNew && (!searchTerm && statusFilter === 'ALL') && (
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={onAddNew}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Giới thiệu ứng viên ngay</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/70">
                    {/* Họ tên & Liên hệ */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{item.candidateName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.candidateEmail}</p>
                        <p className="text-[11px] text-slate-400">{item.candidatePhone}</p>
                      </div>
                    </td>

                    {/* Vị trí & Phòng ban */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1" title={item.jobTitle}>
                          {item.jobTitle}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>🏢 {item.departmentName}</span>
                          <span>•</span>
                          <span>{item.workLocation}</span>
                        </div>
                      </div>
                    </td>

                    {/* Ngày nộp (Giờ Việt Nam) */}
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatVietnamDateTime(item.submittedAt)}</span>
                      </div>
                    </td>

                    {/* Nhãn nguồn */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex items-center rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        Giới thiệu nội bộ
                      </span>
                    </td>

                    {/* Trạng thái tổng quát */}
                    <td className="whitespace-nowrap px-5 py-4">
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* Nút xem chi tiết */}
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReferral(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition shadow-2xs cursor-pointer"
                        title="Xem chi tiết hồ sơ đã nộp"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Xem</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal xem chi tiết hồ sơ (Tuân thủ bảo vệ dữ liệu cá nhân) */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedReferral(null)}
          />

          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 transition-all p-6 sm:p-7">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  Hồ sơ giới thiệu nội bộ
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {selectedReferral.candidateName}
                </h3>
                <p className="text-xs text-slate-500">{selectedReferral.jobTitle}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReferral(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body thông tin hồ sơ */}
            <div className="space-y-4 text-xs">
              {/* Trạng thái hiện tại */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Tiến độ xử lý hiện tại
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {REFERRAL_STATUS_CONFIG[selectedReferral.status]?.description}
                  </p>
                </div>
                <div>{renderStatusBadge(selectedReferral.status)}</div>
              </div>

              {/* Thông tin liên hệ */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                <div>
                  <p className="text-[11px] text-slate-400">Email ứng viên</p>
                  <p className="font-semibold text-slate-800 mt-0.5 truncate">
                    {selectedReferral.candidateEmail}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Số điện thoại</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedReferral.candidatePhone}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Phòng ban</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedReferral.departmentName}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Ngày nộp hồ sơ</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {formatVietnamDateTime(selectedReferral.submittedAt)}
                  </p>
                </div>
              </div>

              {/* Tệp CV đính kèm */}
              <div>
                <p className="font-bold text-slate-800 mb-1.5 uppercase text-[11px] tracking-wide">
                  Tệp CV đã gửi
                </p>
                <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">
                      {selectedReferral.cvFileName}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium shrink-0">
                    Đã tải lên
                  </span>
                </div>
              </div>

              {/* Ghi chú giới thiệu của người gửi */}
              <div>
                <p className="font-bold text-slate-800 mb-1.5 uppercase text-[11px] tracking-wide">
                  Ghi chú &amp; Đánh giá từ người giới thiệu
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 leading-relaxed italic">
                  "{selectedReferral.referralNote}"
                </div>
              </div>

              {/* Thông báo cam kết bảo mật thông tin nội bộ */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-amber-900 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Cam kết bảo mật dữ liệu:</strong> Theo chính sách bảo vệ dữ liệu cá nhân của hệ thống, nhận xét chi tiết, biên bản đánh giá và điểm số nội bộ của hội đồng tuyển dụng được bảo mật để đảm bảo tính công bằng và khách quan.
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReferral(null)}
                className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
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

export default ReferralTrackingTable;
