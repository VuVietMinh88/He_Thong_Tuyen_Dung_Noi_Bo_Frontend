import React, { useState, useEffect } from 'react';
import {
  Send,
  ListOrdered,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { InternalReferralForm } from '../../components/Referral/InternalReferralForm';
import { ReferralTrackingTable } from '../../components/Referral/ReferralTrackingTable';
import type { CandidateReferral } from '../../types/referral';
import { referralService } from '../../services/referral.service';
import { tokenService } from '../../services/token.service';

export const InternalReferralPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'tracking'>('form');
  const [referrals, setReferrals] = useState<CandidateReferral[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState<boolean>(true);

  const currentUser = tokenService.getUserData();

  // Load danh sách hồ sơ giới thiệu
  const loadReferrals = async () => {
    setIsLoadingReferrals(true);
    try {
      const data = await referralService.getMyReferrals(currentUser?.email);
      setReferrals(data);
    } catch {
      setReferrals([]);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const handleReferralSuccess = (newReferral: CandidateReferral) => {
    setReferrals((prev) => [newReferral, ...prev]);
    // Giữ ở form hoặc chuyển sang tracking sau khi nộp
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner: Chương trình giới thiệu ứng viên nội bộ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 -mb-16 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-xs text-indigo-200 mb-3 border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Chương trình Người đồng hành — Smart Referral 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Giới thiệu ứng viên nội bộ
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Hãy cùng xây dựng đội ngũ vững mạnh! Khi bạn giới thiệu thành công đồng nghiệp, bạn bè vào công ty, hệ thống sẽ tự động ghi nhận tên người giới thiệu để bạn nhận các phần thưởng hấp dẫn lên đến <strong>30.000.000 VNĐ / vị trí</strong>.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-indigo-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Gắn nhãn tự động
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Chuẩn hóa 4 trạng thái
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Bảo mật dữ liệu cá nhân
              </span>
            </div>
          </div>

          {/* Hộp thông tin người giới thiệu hiện tại */}
          <div className="shrink-0 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10 text-xs">
            <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
              Tài khoản giới thiệu của bạn
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              {currentUser?.fullName || 'Quản trị viên / Nhân sự'}
            </p>
            <p className="text-[11px] text-indigo-300">
              {currentUser?.email || 'admin@congty.test'}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
              <span className="text-indigo-200">Hồ sơ đã nộp:</span>
              <span className="font-bold text-amber-300 text-sm">{referrals.length} hồ sơ</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabs chuyển đổi giữa Biểu mẫu và Bảng theo dõi */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'form'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Nộp hồ sơ giới thiệu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tracking')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tracking'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
          }`}
        >
          <ListOrdered className="h-4 w-4" />
          <span>Bảng theo dõi hồ sơ của tôi</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'tracking'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {referrals.length}
          </span>
        </button>
      </div>

      {/* 3. Nội dung Tab */}
      {activeTab === 'form' ? (
        <div className="space-y-6">
          <InternalReferralForm
            onSuccess={handleReferralSuccess}
            onCancel={() => setActiveTab('tracking')}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <ReferralTrackingTable
            referrals={referrals}
            isLoading={isLoadingReferrals}
            onRefresh={loadReferrals}
          />
        </div>
      )}
    </div>
  );
};

export default InternalReferralPage;
