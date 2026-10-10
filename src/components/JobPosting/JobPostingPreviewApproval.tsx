import React, { useState, useEffect, useContext } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  Sparkles,
  Smartphone,
  Monitor,
  Share2,
  Check,
  RotateCcw,
  Tag,
  Globe,
  Lock,
  Loader2,
  Clock,
} from 'lucide-react';
import {
  jobPostingService,
  type JobPostingData,
  type JobPostingStatus,
  type JobPostingAuditLog,
} from '../../services/jobPostingService';
import { ToastContext } from '../notifications/ToastContext';
import {
  JobPostingApprovalModal,
  type ApprovalModalMode,
} from './JobPostingApprovalModal';
import { JobPostingAuditHistory } from './JobPostingAuditHistory';

export interface JobPostingPreviewApprovalProps {
  jobPostingId?: string;
  initialData?: JobPostingData;
  onBack?: () => void;
  onStatusChange?: (updated: JobPostingData) => void;
}

const DEFAULT_MOCK_POSTING: JobPostingData = {
  id: 'jp-demo-306',
  requisitionId: 'req-app-999',
  title: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
  positionTitle: 'Senior Frontend Developer',
  departmentId: 'dept-tech',
  departmentName: 'Khối Công nghệ & Sản phẩm',
  workLocation: 'Hà Nội',
  employmentType: 'FULL_TIME',
  level: 'SENIOR',
  headcount: 2,
  deadline: '2026-12-31',
  salaryType: 'RANGE',
  salaryMin: 25,
  salaryMax: 45,
  currency: 'VND',
  isSalaryNegotiable: true,
  jobDescription: `- Tham gia nghiên cứu, thiết kế kiến trúc và phát triển giao diện hệ thống Web Application tuyển dụng quy mô doanh nghiệp.
- Phối hợp chặt chẽ cùng Product Manager, UI/UX Designer và Backend team để đưa các tính năng từ bản vẽ thành sản phẩm hoàn thiện.
- Tối ưu hóa hiệu năng render, Core Web Vitals, bảo đảm trải nghiệm mượt mà trên mọi thiết bị.
- Hướng dẫn, hỗ trợ các thành viên junior và tham gia xây dựng chuẩn hóa UI Design System chung.`,
  requirements: `- Có từ 3 năm kinh nghiệm thực chiến phát triển ứng dụng web với React và TypeScript.
- Nắm vững kiến trúc component, React Hooks, State Management (Context, Zustand/Redux), và styling với Tailwind CSS.
- Có kinh nghiệm tối ưu hóa hiệu năng frontend và tư duy Clean Architecture.
- Kỹ năng giao tiếp tốt, tinh thần trách nhiệm cao và khả năng giải quyết vấn đề độc lập.`,
  benefits: `- Thu nhập cạnh tranh từ 25 - 45 triệu VNĐ/tháng kèm thưởng kết quả công việc hàng quý.
- Xét tăng lương định kỳ 2 lần/năm, thưởng tháng lương thứ 13+.
- Gói bảo hiểm sức khỏe toàn diện cao cấp cho bản thân và người thân.
- Trang bị MacBook Pro M-series cùng màn hình 4K theo tiêu chuẩn công việc.
- Chế độ nghỉ dưỡng thường niên, teambuilding và hỗ trợ 100% học phí thi chứng chỉ quốc tế.`,
  skills: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'RESTful API', 'Git'],
  status: 'PENDING_APPROVAL',
  publishInternal: true,
  publishCareerPage: true,
  createdBy: {
    id: 'usr-hr-001',
    name: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@company.com',
    role: 'Chuyên viên Tuyển dụng (Recruiter)',
    department: 'Khối Công nghệ & Sản phẩm',
  },
  auditLogs: [
    {
      id: 'log-demo-1',
      postingId: 'jp-demo-306',
      action: 'CREATED',
      actionName: 'Tạo bản nháp tin tuyển dụng',
      actor: {
        id: 'usr-hr-001',
        name: 'Nguyễn Văn Minh',
        email: 'minh.nguyen@company.com',
        role: 'Chuyên viên Tuyển dụng (Recruiter)',
        department: 'Khối Công nghệ & Sản phẩm',
      },
      timestamp: '2026-10-10T08:00:00Z',
      fromStatus: 'DRAFT',
      toStatus: 'DRAFT',
      note: 'Khởi tạo tin tuyển dụng từ Yêu cầu tuyển dụng #REQ-2026-001 đã duyệt.',
      metadata: {
        channels: ['Cổng thông tin nội bộ', 'Trang nghề nghiệp (Career Page)'],
      },
    },
    {
      id: 'log-demo-2',
      postingId: 'jp-demo-306',
      action: 'SUBMITTED',
      actionName: 'Gửi yêu cầu phê duyệt',
      actor: {
        id: 'usr-hr-001',
        name: 'Nguyễn Văn Minh',
        email: 'minh.nguyen@company.com',
        role: 'Chuyên viên Tuyển dụng (Recruiter)',
        department: 'Khối Công nghệ & Sản phẩm',
      },
      timestamp: '2026-10-10T10:00:00Z',
      fromStatus: 'DRAFT',
      toStatus: 'PENDING_APPROVAL',
      note: 'Đã hoàn thiện nội dung JD và các kênh phát hành, gửi cấp quản lý phê duyệt.',
    },
  ],
  createdAt: '2026-10-10T08:00:00Z',
  updatedAt: '2026-10-10T10:00:00Z',
};

export const JobPostingPreviewApproval: React.FC<JobPostingPreviewApprovalProps> = ({
  jobPostingId,
  initialData,
  onBack,
  onStatusChange,
}) => {
  const toastContext = useContext(ToastContext);

  const [posting, setPosting] = useState<JobPostingData>(initialData || DEFAULT_MOCK_POSTING);
  const [activeTab, setActiveTab] = useState<'preview' | 'history'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ApprovalModalMode>('APPROVE');

  // Thông báo nội bộ
  const [localMessage, setLocalMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  const showNotify = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setLocalMessage({ type, text });
    if (toastContext?.notify) {
      toastContext.notify(text, type);
    }
  };

  // 1. Tải dữ liệu tin tuyển dụng nếu có ID
  useEffect(() => {
    if (!jobPostingId) return;

    let isMounted = true;
    setIsLoading(true);

    jobPostingService
      .getJobPostingById(jobPostingId)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setPosting(data);
        }
      })
      .catch(() => {
        // Fallback giữ nguyên mock nếu offline
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [jobPostingId]);

  // Định dạng hiển thị lương
  const formatSalary = () => {
    if (posting.salaryType === 'NEGOTIABLE') return 'Thỏa thuận';
    if (posting.salaryType === 'UP_TO') {
      return `Lên đến ${posting.salaryMax} triệu ${posting.currency}`;
    }
    if (posting.salaryType === 'STARTING_FROM') {
      return `Từ ${posting.salaryMin} triệu ${posting.currency}`;
    }
    return `${posting.salaryMin} - ${posting.salaryMax} triệu ${posting.currency}`;
  };

  // Mở modal hành động
  const handleOpenModal = (mode: ApprovalModalMode) => {
    setModalMode(mode);
    setModalOpen(true);
  };

  // Xử lý xác nhận trong Modal (AC2 & AC3)
  const handleModalConfirm = async (reasonOrNote: string) => {
    if (!posting.id) return;

    setIsSubmitting(true);
    setLocalMessage(null);

    try {
      let updated: JobPostingData;

      if (modalMode === 'APPROVE') {
        updated = await jobPostingService.approveJobPosting(posting.id, reasonOrNote);
        showNotify('Đã phê duyệt và xuất bản tin tuyển dụng thành công! Đã ghi nhận vết kiểm toán.', 'success');
      } else if (modalMode === 'REJECT') {
        updated = await jobPostingService.rejectJobPosting(posting.id, reasonOrNote);
        showNotify('Đã từ chối tin tuyển dụng và lưu lý do thành công.', 'warning');
      } else {
        updated = await jobPostingService.requestRevisionJobPosting(posting.id, reasonOrNote);
        showNotify('Đã gửi yêu cầu chỉnh sửa tới người soạn thảo thành công.', 'warning');
      }

      setPosting((prev) => {
        let newLogs = prev.auditLogs ? [...prev.auditLogs] : [];
        if (updated.auditLogs && updated.auditLogs.length > 0) {
          updated.auditLogs.forEach((ulog) => {
            if (!newLogs.some((l) => l.id === ulog.id)) {
              newLogs.unshift(ulog);
            }
          });
        } else {
          const approverRef = {
            id: 'usr-mgr-002',
            name: 'Trần Thị Thu Hà',
            email: 'ha.tran@company.com',
            role: 'Trưởng phòng Tuyển dụng & Đãi ngộ',
            department: 'Ban Quản trị Nguồn nhân lực',
          };
          const createdLog: JobPostingAuditLog = {
            id: `log-act-${Date.now()}`,
            postingId: posting.id || '',
            action: modalMode === 'APPROVE' ? 'PUBLISHED' : modalMode === 'REJECT' ? 'REJECTED' : 'REVISION_REQUESTED',
            actionName: modalMode === 'APPROVE' ? 'Duyệt & Xuất bản' : modalMode === 'REJECT' ? 'Từ chối tin tuyển dụng' : 'Yêu cầu chỉnh sửa',
            actor: approverRef,
            timestamp: new Date().toISOString(),
            fromStatus: prev.status,
            toStatus: updated.status,
            note: reasonOrNote.trim(),
            metadata: modalMode === 'APPROVE' ? {
              channels: ['Cổng thông tin nội bộ', 'Trang nghề nghiệp (Career Page)'],
            } : undefined,
          };
          newLogs.unshift(createdLog);
        }

        return {
          ...prev,
          ...updated,
          auditLogs: newLogs,
        };
      });

      setModalOpen(false);
      if (onStatusChange) onStatusChange(updated);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi thực hiện thao tác.';
      showNotify(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: JobPostingStatus) => {
    switch (status) {
      case 'PUBLISHED':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Đã duyệt xuất bản
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Chờ phê duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-300">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
            Đã từ chối
          </span>
        );
      case 'REVISION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-300">
            <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
            Yêu cầu chỉnh sửa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-300">
            Bản nháp (Draft)
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      {/* Top Banner Message */}
      {localMessage && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 shadow-sm ring-1 transition-all animate-in fade-in ${
            localMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 ring-emerald-300'
              : localMessage.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-900 ring-rose-300'
              : 'border-amber-200 bg-amber-50 text-amber-900 ring-amber-300'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            {localMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : localMessage.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <p className="text-xs font-semibold">{localMessage.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setLocalMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Header & Management Action Bar (AC2) */}
      <div className="sticky top-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 backdrop-blur-md shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay lại
                </button>
              )}
              <span>/</span>
              <span>Duyệt tin tuyển dụng</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">#{posting.id}</span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Xem Trước &amp; Duyệt Tin Tuyển Dụng
              </h1>
              {renderStatusBadge(posting.status)}
            </div>
          </div>

          {/* Action Buttons Group (AC2) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Device Switcher (Desktop / Mobile Preview) */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  deviceMode === 'desktop'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem giao diện máy tính (Desktop)"
              >
                <Monitor className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  deviceMode === 'mobile'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem giao diện di động (Mobile)"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* Từ chối */}
            <button
              type="button"
              onClick={() => handleOpenModal('REJECT')}
              disabled={isSubmitting || posting.status === 'REJECTED'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Từ chối</span>
            </button>

            {/* Yêu cầu chỉnh sửa */}
            <button
              type="button"
              onClick={() => handleOpenModal('REQUEST_REVISION')}
              disabled={isSubmitting || posting.status === 'PUBLISHED'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Yêu cầu sửa</span>
            </button>

            {/* Duyệt xuất bản */}
            <button
              type="button"
              onClick={() => handleOpenModal('APPROVE')}
              disabled={isSubmitting || posting.status === 'PUBLISHED'}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Duyệt xuất bản</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Preview vs Audit History) & Quick Publisher Info (AC2) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Màn hình xem trước (Preview)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Lịch sử người đăng &amp; Kiểm toán</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'history'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {posting.auditLogs?.length || 2}
            </span>
          </button>
        </div>

        {/* Quick Author & Approver Info Snippet */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>
            Người đăng: <strong className="text-slate-800">{posting.createdBy?.name || 'Nguyễn Văn Minh'}</strong>
          </span>
          {posting.status === 'PUBLISHED' && (
            <>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">
                Duyệt bởi: {posting.publishedBy?.name || posting.reviewedBy || 'Trần Thị Thu Hà'}
              </span>
            </>
          )}
        </div>
      </div>

      {activeTab === 'history' ? (
        <JobPostingAuditHistory
          postingId={posting.id}
          posting={posting}
          initialLogs={posting.auditLogs}
        />
      ) : (
        <>

      {/* Review Feedback Alert (Nếu có lý do từ chối hoặc góp ý trước đó) */}
      {(posting.rejectionReason || posting.revisionFeedback || posting.approvalNote) && (
        <div className="rounded-2xl border p-4.5 shadow-2xs space-y-2 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Lịch sử ghi chú &amp; Phản hồi kiểm duyệt:
            </span>
          </div>
          {posting.rejectionReason && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900">
              <strong>Lý do từ chối:</strong> {posting.rejectionReason}
            </div>
          )}
          {posting.revisionFeedback && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
              <strong>Yêu cầu chỉnh sửa:</strong> {posting.revisionFeedback}
            </div>
          )}
          {posting.approvalNote && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
              <strong>Ghi chú duyệt:</strong> {posting.approvalNote}
            </div>
          )}
        </div>
      )}

      {/* Realistic Job Posting Preview Canvas (AC1) */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-semibold text-slate-700">Đang tải dữ liệu tin tuyển dụng...</p>
          <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
        </div>
      ) : (
        <div
          className={`mx-auto transition-all duration-300 ${
            deviceMode === 'mobile' ? 'max-w-md ring-8 ring-slate-800 rounded-3xl shadow-2xl p-1 bg-slate-800' : 'w-full'
          }`}
        >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Hero Banner Header */}
          <div className="relative border-b border-slate-100 bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-md bg-indigo-500/30 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-indigo-200 border border-indigo-400/20">
                {posting.level}
              </span>
              <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/20">
                {posting.employmentType === 'FULL_TIME'
                  ? 'Toàn thời gian'
                  : posting.employmentType === 'PART_TIME'
                  ? 'Bán thời gian'
                  : 'Hợp đồng dự án'}
              </span>
              <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200">
                {posting.departmentName || 'Phòng ban tuyển dụng'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {posting.title}
            </h1>

            {/* Channels & Meta Specs */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-white/10 pt-5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{posting.workLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-emerald-300">{formatSalary()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Số lượng: {posting.headcount} nhân sự</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Hạn nộp: {posting.deadline || 'Đang cập nhật'}</span>
              </div>
            </div>

            {/* Publishing Channels Indicators */}
            <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-white/10 text-[11px] text-slate-300">
              <span className="text-slate-400">Kênh phát hành:</span>
              {posting.publishInternal && (
                <span className="flex items-center gap-1 rounded bg-indigo-500/20 px-2 py-0.5 text-indigo-300">
                  <Lock className="h-3 w-3" /> Cổng nội bộ
                </span>
              )}
              {posting.publishCareerPage && (
                <span className="flex items-center gap-1 rounded bg-teal-500/20 px-2 py-0.5 text-teal-300">
                  <Globe className="h-3 w-3" /> Trang nghề nghiệp (Career Page)
                </span>
              )}
            </div>
          </div>

          {/* Job Details Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Skills Tags */}
            {posting.skills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Kỹ năng yêu cầu
                </h3>
                <div className="flex flex-wrap gap-2">
                  {posting.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700"
                    >
                      <Tag className="h-3 w-3 text-indigo-500" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mô tả công việc */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                Mô tả công việc (Job Description)
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-5 rounded-xl border border-slate-100">
                {posting.jobDescription}
              </div>
            </div>

            {/* Yêu cầu ứng viên */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Yêu cầu ứng viên (Requirements)
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-5 rounded-xl border border-slate-100">
                {posting.requirements}
              </div>
            </div>

            {/* Quyền lợi được hưởng */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Quyền lợi được hưởng (Benefits)
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-5 rounded-xl border border-slate-100">
                {posting.benefits || 'Đãi ngộ cạnh tranh theo chính sách của công ty.'}
              </div>
            </div>

            {/* Demo Apply Section */}
            <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-xs text-slate-500">
                Ứng tuyển trực tuyến để kết nối với cơ hội phát triển sự nghiệp tại tổ chức.
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 cursor-default"
                >
                  <Share2 className="h-3.5 w-3.5 inline mr-1" /> Chia sẻ tin
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white opacity-90 cursor-default shadow-xs"
                >
                  Nộp hồ sơ ứng tuyển
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
        </>
      )}

      {/* Confirmation & Rejection Modal (AC3) */}
      <JobPostingApprovalModal
        isOpen={modalOpen}
        mode={modalMode}
        jobTitle={posting.title}
        isSubmitting={isSubmitting}
        onConfirm={handleModalConfirm}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default JobPostingPreviewApproval;
