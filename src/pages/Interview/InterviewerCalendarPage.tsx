import React, { useState, useEffect, useMemo, useCallback, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  Eye,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  Award,
  RefreshCw,
  Copy,
  Check,
  X,
  ShieldCheck,
  Building2,
  Briefcase,
  CalendarDays,
  LayoutList,
  Lock,
} from 'lucide-react';
import { tokenService } from '../../services/token.service';
import { interviewService, calculateEndTime } from '../../services/interviewService';
import { candidateProfileService } from '../../services/candidateProfileService';
import { useContext } from 'react';
import { ToastContext } from '../../components/notifications/ToastContext';
import type { InterviewSchedulePayload, InterviewFormat } from '../../types/interview';
import CandidateResponseStatus from '../../components/Candidate/CandidateResponseStatus';
import { InterviewEvaluationModal } from '../../components/Interview/InterviewEvaluationModal';
import { resolveEvaluationCriteriaForJob } from '../../utils/interviewEvaluationHelper';

export type CalendarViewMode = 'CARDS' | 'CALENDAR';
export type FilterStatus = 'ALL' | 'NEED_EVALUATION' | 'UPCOMING' | 'TODAY' | 'COMPLETED';

const LOCAL_STORAGE_EVALUATION_PREFIX = 'smart_recruitment_interview_evaluation_';

export const InterviewerCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const toastContext = useContext(ToastContext);
  const addToast = useCallback(
    (options: { message: string; type?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => {
      if (toastContext?.addToast) {
        return toastContext.addToast(options);
      }
      return '';
    },
    [toastContext],
  );
  const searchInputId = useId();

  // Người dùng hiện tại (Interviewer) (AC 3)
  const currentUser = tokenService.getUserData();
  const interviewerId = currentUser?.id || 'usr-001';
  const interviewerName = currentUser?.fullName || 'Người phỏng vấn';
  const interviewerEmail = currentUser?.email || 'interviewer@smartrecruitment.vn';

  // Ngày hôm nay theo múi giờ Việt Nam YYYY-MM-DD (Asia/Ho_Chi_Minh)
  const todayVN = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }, []);

  /**
   * Khởi tạo dữ liệu mẫu phong phú gán cho Interviewer hiện tại
   * nếu hệ thống chưa có dữ liệu hoặc dùng offline
   */
  const createDefaultInterviews = useCallback((): InterviewSchedulePayload[] => {
    // Tính toán mốc ngày: Hôm nay, Ngày mai, Hôm qua, 3 ngày trước
    const now = new Date();
    const formatDate = (offsetDays: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offsetDays);
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    };

    const dateToday = formatDate(0);
    const dateTomorrow = formatDate(1);
    const dateYesterday = formatDate(-1);
    const datePast3Days = formatDate(-3);

    return [
      {
        id: 'int-cal-001',
        candidateId: 'can-demo-891',
        candidateName: 'Lê Quốc Bảo',
        candidateEmail: 'bao.lequoc.tech@gmail.com',
        applicationId: 'app-2026-002',
        jobTitle: 'Senior Frontend Developer (React, TypeScript)',
        departmentName: 'Khối Công nghệ & Sản phẩm',
        roundName: 'Vòng 2: Chuyên môn & Kỹ thuật',
        interviewRound: 'Vòng 2: Chuyên môn & Kỹ thuật',
        interviewDate: dateToday,
        interviewTime: '14:00',
        scheduledDateTimeISO: `${dateToday}T14:00:00+07:00`,
        startTime: `${dateToday}T14:00:00+07:00`,
        durationMinutes: 60,
        format: 'ONLINE' as InterviewFormat,
        interviewType: 'ONLINE' as InterviewFormat,
        locationOrLink: 'https://meet.google.com/abc-defg-hij',
        interviewerIds: [interviewerId, 'usr-005'],
        interviewers: [
          {
            id: interviewerId,
            name: interviewerName,
            email: interviewerEmail,
            role: 'Trưởng hội đồng phỏng vấn (Interviewer)',
          },
          {
            id: 'usr-005',
            name: 'Vũ Đức Đạt',
            email: 'dat.vu@smartrecruitment.vn',
            role: 'Frontend Tech Lead',
          },
        ],
        status: 'SCHEDULED',
        candidateResponse: {
          status: 'CONFIRMED',
          respondedAt: `${dateToday}T08:30:00+07:00`,
        },
        cvFileName: 'CV_LeQuocBao_Senior_Frontend_Lead_2026.pdf',
        cvUrl: '/assets/sample-cv.pdf',
        isEvaluationSubmitted: false,
        notes: 'Tập trung đánh giá sâu về React 19, Tối ưu hiệu năng và Tư duy phân rã component.',
      },
      {
        id: 'int-cal-002',
        candidateId: 'can-demo-892',
        candidateName: 'Nguyễn Hoàng Nam',
        candidateEmail: 'nam.nguyen.backend@gmail.com',
        applicationId: 'app-2026-003',
        jobTitle: 'Backend Tech Lead (Golang / Microservices)',
        departmentName: 'Khối Công nghệ & Sản phẩm',
        roundName: 'Vòng 2: Kiến trúc Hệ thống',
        interviewRound: 'Vòng 2: Kiến trúc Hệ thống',
        interviewDate: dateYesterday,
        interviewTime: '10:00',
        scheduledDateTimeISO: `${dateYesterday}T10:00:00+07:00`,
        startTime: `${dateYesterday}T10:00:00+07:00`,
        durationMinutes: 60,
        format: 'ONLINE' as InterviewFormat,
        interviewType: 'ONLINE' as InterviewFormat,
        locationOrLink: 'https://zoom.us/j/9876543210?pwd=rec',
        interviewerIds: [interviewerId, 'usr-003'],
        interviewers: [
          {
            id: interviewerId,
            name: interviewerName,
            email: interviewerEmail,
            role: 'Người phỏng vấn chính',
          },
          {
            id: 'usr-003',
            name: 'Lê Minh Tuấn',
            email: 'tuan.le@smartrecruitment.vn',
            role: 'Kiến trúc sư Phần mềm (Principal Architect)',
          },
        ],
        status: 'COMPLETED',
        candidateResponse: {
          status: 'CONFIRMED',
        },
        cvFileName: 'CV_NguyenHoangNam_Backend_Lead.pdf',
        cvUrl: '/assets/sample-cv-backend.pdf',
        isEvaluationSubmitted: false, // Buổi đã diễn ra nhưng CHƯA NỘP PHIẾU ĐÁNH GIÁ (AC 2)
        notes: 'Buổi phỏng vấn đã diễn ra ngày hôm qua. Cần hoàn tất nộp phiếu đánh giá năng lực sớm.',
      },
      {
        id: 'int-cal-003',
        candidateId: 'can-demo-893',
        candidateName: 'Trần Mai Anh',
        candidateEmail: 'maianh.designer@gmail.com',
        applicationId: 'app-2026-004',
        jobTitle: 'Lead UI/UX Designer',
        departmentName: 'Trung tâm Trải nghiệm Khách hàng',
        roundName: 'Vòng 1: Đánh giá Portfolio & Năng lực Thiết kế',
        interviewRound: 'Vòng 1: Đánh giá Portfolio & Năng lực Thiết kế',
        interviewDate: dateTomorrow,
        interviewTime: '09:30',
        scheduledDateTimeISO: `${dateTomorrow}T09:30:00+07:00`,
        startTime: `${dateTomorrow}T09:30:00+07:00`,
        durationMinutes: 45,
        format: 'OFFLINE' as InterviewFormat,
        interviewType: 'OFFLINE' as InterviewFormat,
        locationOrLink: 'Phòng họp Tokyo - Tầng 5, Tòa nhà Innovation Hub',
        interviewerIds: [interviewerId, 'usr-004'],
        interviewers: [
          {
            id: interviewerId,
            name: interviewerName,
            email: interviewerEmail,
            role: 'Người phỏng vấn',
          },
          {
            id: 'usr-004',
            name: 'Phạm Thị Lan Hương',
            email: 'huong.pham@smartrecruitment.vn',
            role: 'Giám đốc Nhân sự (HR Director)',
          },
        ],
        status: 'SCHEDULED',
        candidateResponse: {
          status: 'CONFIRMED',
        },
        cvFileName: 'Portfolio_CV_TranMaiAnh_Design.pdf',
        cvUrl: '/assets/sample-cv-design.pdf',
        isEvaluationSubmitted: false,
        notes: 'Ứng viên sẽ trình chiếu Case Study dự án thiết kế Design System doanh nghiệp.',
      },
      {
        id: 'int-cal-004',
        candidateId: 'can-demo-894',
        candidateName: 'Vũ Phương Thảo',
        candidateEmail: 'thao.vu.qa@gmail.com',
        applicationId: 'app-2026-005',
        jobTitle: 'Chuyên viên QA/QC Automation Lead',
        departmentName: 'Bộ phận Đảm bảo Chất lượng',
        roundName: 'Vòng 1: Phỏng vấn Kỹ thuật Automation',
        interviewRound: 'Vòng 1: Phỏng vấn Kỹ thuật Automation',
        interviewDate: datePast3Days,
        interviewTime: '15:30',
        scheduledDateTimeISO: `${datePast3Days}T15:30:00+07:00`,
        startTime: `${datePast3Days}T15:30:00+07:00`,
        durationMinutes: 60,
        format: 'OFFLINE' as InterviewFormat,
        interviewType: 'OFFLINE' as InterviewFormat,
        locationOrLink: 'Phòng họp Hà Nội - Tầng 3, Trụ sở chính',
        interviewerIds: [interviewerId, 'usr-006'],
        interviewers: [
          {
            id: interviewerId,
            name: interviewerName,
            email: interviewerEmail,
            role: 'Người phỏng vấn',
          },
          {
            id: 'usr-006',
            name: 'Hoàng Minh Châu',
            email: 'chau.hoang@smartrecruitment.vn',
            role: 'Trưởng nhóm Kiểm thử (QA Lead)',
          },
        ],
        status: 'COMPLETED',
        candidateResponse: {
          status: 'CONFIRMED',
        },
        cvFileName: 'CV_VuPhuongThao_QA_Automation.pdf',
        cvUrl: '/assets/sample-cv-qa.pdf',
        isEvaluationSubmitted: true, // ĐÃ HOÀN TẤT NỘP PHIẾU ĐÁNH GIÁ
        evaluationScore: 4.4,
        notes: 'Đã hoàn tất đánh giá và chấm điểm năng lực. Kết luận: Đạt yêu cầu cao.',
      },
    ];
  }, [interviewerId, interviewerName, interviewerEmail]);

  // State chính - khởi tạo sẵn danh sách phỏng vấn cá nhân hóa (AC 1 & AC 3)
  const [interviews, setInterviews] = useState<InterviewSchedulePayload[]>(() => createDefaultInterviews());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('CARDS');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Điều khiển lịch tuần/tháng
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

  // Modal xem trước CV
  const [previewCvInterview, setPreviewCvInterview] = useState<InterviewSchedulePayload | null>(null);
  const [isDownloadingCv, setIsDownloadingCv] = useState<boolean>(false);

  // Modal đánh giá năng lực
  const [evaluatingInterview, setEvaluatingInterview] = useState<InterviewSchedulePayload | null>(null);

  /**
   * Tải danh sách lịch phỏng vấn cá nhân có kiểm soát phân quyền chặt chẽ (AC 1 & AC 3)
   */
  const loadSchedule = useCallback(async () => {
    try {
      setIsLoading(true);

      // Gọi API qua interviewService với mã interviewer cá nhân
      const rawList = await interviewService.getPersonalInterviewSchedule({
        userId: interviewerId,
        interviewerId,
      });

      // Kiểm soát chặt chẽ ở tầng giao diện và dữ liệu (AC 3: Data Privacy & Access Control)
      // TUYỆT ĐỐI CHỈ HIỂN THỊ CÁC BUỔI MÀ CHÍNH TÀI KHOẢN HIỆN TẠI ĐƯỢC MỜI
      const sanitizedUserEmail = (interviewerEmail || '').toLowerCase().trim();
      let assignedList = (rawList || []).filter((item) => {
        const inIds = Boolean(item.interviewerIds && item.interviewerIds.includes(interviewerId));
        const inInterviewers = Boolean(
          item.interviewers &&
            item.interviewers.some(
              (inv) =>
                inv.id === interviewerId ||
                (inv.email && inv.email.toLowerCase().trim() === sanitizedUserEmail),
            ),
        );
        return inIds || inInterviewers;
      });

      // Nếu bộ nhớ trống (lần đầu truy cập / demo), khởi tạo danh sách mẫu cá nhân hóa
      if (assignedList.length === 0) {
        const defaults = createDefaultInterviews();
        assignedList = defaults;
        defaults.forEach((item) => interviewService.saveInterviewToStorage(item));
      }

      // Kiểm tra trạng thái nộp phiếu đánh giá từ LocalStorage đồng bộ
      const enrichedList = assignedList.map((item) => {
        const evalKey = `${LOCAL_STORAGE_EVALUATION_PREFIX}${item.id}_${interviewerId}`;
        const hasSavedEvaluation = localStorage.getItem(evalKey);

        if (hasSavedEvaluation) {
          try {
            const parsed = JSON.parse(hasSavedEvaluation);
            return {
              ...item,
              isEvaluationSubmitted: true,
              evaluationScore: parsed.calculatedTotalScore ?? item.evaluationScore,
            };
          } catch {
            return { ...item, isEvaluationSubmitted: true };
          }
        }
        return item;
      });

      // Sắp xếp theo mốc thời gian diễn ra gần nhất (Sắp xếp tăng dần theo startTime / ISO)
      enrichedList.sort((a, b) => {
        const timeA = new Date(a.startTime || a.scheduledDateTimeISO).getTime();
        const timeB = new Date(b.startTime || b.scheduledDateTimeISO).getTime();
        return timeA - timeB;
      });

      setInterviews(enrichedList);
    } catch {
      addToast({
        message: 'Không thể đồng bộ lịch phỏng vấn cá nhân từ máy chủ, đang dùng dữ liệu dự phòng.',
        type: 'warning',
      });
      const defaults = createDefaultInterviews();
      setInterviews(defaults);
    } finally {
      setIsLoading(false);
    }
  }, [interviewerId, interviewerEmail, createDefaultInterviews, addToast]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  /**
   * Kiểm tra xem buổi phỏng vấn đã kết thúc theo thời gian thực tế chưa
   * (theo múi giờ Asia/Ho_Chi_Minh)
   */
  const checkIsPastInterview = useCallback((item: InterviewSchedulePayload): boolean => {
    if (item.status === 'COMPLETED') return true;
    if (item.status === 'CANCELLED') return false;

    try {
      const timeStr = item.interviewTime || '00:00';
      const endTimeStr = calculateEndTime(timeStr, item.durationMinutes || 60);
      const endIso = `${item.interviewDate}T${endTimeStr}:00+07:00`;
      const endDate = new Date(endIso);
      return !isNaN(endDate.getTime()) && Date.now() >= endDate.getTime();
    } catch {
      return item.interviewDate < todayVN;
    }
  }, [todayVN]);

  /**
   * Tính toán thời gian bắt đầu và kết thúc (theo múi giờ Asia/Ho_Chi_Minh) (AC 1)
   */
  const formatTimeSlotVN = (timeStr: string, durationMinutes: number) => {
    const endStr = calculateEndTime(timeStr, durationMinutes);
    return `${timeStr} - ${endStr}`;
  };

  /**
   * Sao chép link họp trực tuyến
   */
  const handleCopyMeetingLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    addToast({
      message: 'Đã sao chép liên kết phòng họp trực tuyến vào bộ nhớ đệm.',
      type: 'success',
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  /**
   * Tải tệp CV ứng viên về máy
   */
  const handleDownloadCv = async (interview: InterviewSchedulePayload) => {
    if (isDownloadingCv) return;
    try {
      setIsDownloadingCv(true);
      const fileName = interview.cvFileName || `CV_${interview.candidateName.replace(/\s+/g, '_')}.pdf`;

      if (interview.applicationId) {
        await candidateProfileService.downloadApplicationCv(interview.applicationId, fileName);
      } else {
        const link = document.createElement('a');
        link.href = interview.cvUrl || '/assets/sample-cv.pdf';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      addToast({
        message: `Đang tải xuống tệp CV: ${fileName}`,
        type: 'success',
      });
    } catch {
      addToast({
        message: 'Tải CV gặp sự cố, vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setIsDownloadingCv(false);
    }
  };

  /**
   * Thống kê các chỉ số nhanh của Interviewer
   */
  const stats = useMemo(() => {
    const total = interviews.length;
    const today = interviews.filter((i) => i.interviewDate === todayVN && i.status !== 'CANCELLED').length;
    const upcoming = interviews.filter((i) => i.interviewDate >= todayVN && i.status === 'SCHEDULED').length;

    // Các buổi đã diễn ra nhưng CHƯA NỘP PHIẾU ĐÁNH GIÁ (AC 2)
    const needEvaluation = interviews.filter((i) => checkIsPastInterview(i) && !i.isEvaluationSubmitted).length;
    const completed = interviews.filter((i) => i.isEvaluationSubmitted || i.status === 'COMPLETED').length;

    return { total, today, upcoming, needEvaluation, completed };
  }, [interviews, todayVN, checkIsPastInterview]);

  /**
   * Bộ lọc danh sách phỏng vấn theo điều kiện
   */
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const isPast = checkIsPastInterview(item);

      // 1. Lọc theo trạng thái
      if (statusFilter === 'NEED_EVALUATION' && (!isPast || item.isEvaluationSubmitted)) return false;
      if (statusFilter === 'TODAY' && item.interviewDate !== todayVN) return false;
      if (statusFilter === 'UPCOMING' && (item.interviewDate < todayVN || item.status !== 'SCHEDULED')) return false;
      if (statusFilter === 'COMPLETED' && !item.isEvaluationSubmitted && item.status !== 'COMPLETED') return false;

      // 2. Lọc theo hình thức
      if (formatFilter !== 'ALL' && item.format !== formatFilter) return false;

      // 3. Lọc theo ngày cụ thể (DatePicker)
      if (dateFilter && item.interviewDate !== dateFilter) return false;

      // 4. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.candidateName.toLowerCase().includes(q);
        const matchTitle = item.jobTitle?.toLowerCase().includes(q) ?? false;
        const matchDept = item.departmentName?.toLowerCase().includes(q) ?? false;
        const matchRound = item.roundName.toLowerCase().includes(q);
        const matchInterviewer = item.interviewers.some((inv) => inv.name.toLowerCase().includes(q));
        if (!matchName && !matchTitle && !matchDept && !matchRound && !matchInterviewer) return false;
      }

      return true;
    });
  }, [interviews, statusFilter, formatFilter, dateFilter, searchQuery, todayVN, checkIsPastInterview]);

  /**
   * Tính toán danh sách ngày trong tuần hiện tại cho chế độ xem Lịch (Calendar View)
   */
  const currentWeekDays = useMemo(() => {
    const curr = new Date(selectedCalendarDate);
    const dayOfWeek = curr.getDay(); // 0: Chủ nhật, 1: Thứ 2...
    const distanceToMonday = (dayOfWeek + 6) % 7; // Số ngày từ Thứ 2

    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);

      const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
      weekDays.push({
        date: d,
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        month: d.getMonth() + 1,
        isToday: dateStr === todayVN,
        interviewsCount: interviews.filter((item) => item.interviewDate === dateStr).length,
      });
    }
    return weekDays;
  }, [selectedCalendarDate, interviews, todayVN]);

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header Trang & Phân quyền bảo mật cá nhân (AC 3) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Lịch cá nhân người phỏng vấn
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Phân quyền cá nhân
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Quản lý lịch trình, xem trước hồ sơ CV và nộp phiếu đánh giá năng lực các buổi phỏng vấn bạn được phân công.
                </p>
              </div>
            </div>

            {/* Thông tin xác thực Interviewer hiện tại */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Tài khoản: <strong className="text-slate-800">{interviewerName}</strong> ({interviewerEmail})
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Lock className="w-3 h-3 text-slate-400" />
                Chỉ hiển thị lịch bạn được mời • Đã ẩn thông tin lương/offer nhạy cảm
              </span>
            </div>
          </div>

          {/* Các nút hành động Header */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Nút chuyển đổi View Mode: Danh sách thẻ (Cards) vs Lịch trực quan (Calendar) (AC 1) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem dạng danh sách thẻ chi tiết"
              >
                <LayoutList className="w-3.5 h-3.5" />
                Danh sách
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CALENDAR')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'CALENDAR'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem dạng lịch tuần trực quan"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Lịch tuần
              </button>
            </div>

            <button
              type="button"
              onClick={loadSchedule}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* 2. Thống kê chỉ số nhanh (KPI Summary Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Tổng buổi tham gia</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/25 shadow-xs">
          <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Sắp diễn ra
          </span>
          <div className="text-2xl font-black text-indigo-800 mt-1">{stats.upcoming}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/25 shadow-xs">
          <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Hôm nay
          </span>
          <div className="text-2xl font-black text-blue-800 mt-1">{stats.today}</div>
        </div>

        {/* NỔI BẬT: Cảnh báo chưa nộp phiếu đánh giá (AC 2) */}
        <div
          onClick={() => setStatusFilter('NEED_EVALUATION')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
            stats.needEvaluation > 0
              ? 'border-amber-300 bg-amber-50/70 hover:bg-amber-100/60 ring-2 ring-amber-200/60'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-bold text-amber-800 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Chưa nộp đánh giá
            </span>
            {stats.needEvaluation > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </span>
          <div className="text-2xl font-black text-amber-900 mt-1 flex items-baseline gap-1.5">
            {stats.needEvaluation}
            <span className="text-xs font-semibold text-amber-700">buổi</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/25 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn thành
          </span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{stats.completed}</div>
        </div>
      </div>

      {/* 3. Thanh tìm kiếm & Bộ lọc linh hoạt */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Quick status tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Tất cả' },
              {
                id: 'NEED_EVALUATION',
                label: `Cần nộp đánh giá (${stats.needEvaluation})`,
                highlight: stats.needEvaluation > 0,
              },
              { id: 'TODAY', label: `Hôm nay (${stats.today})` },
              { id: 'UPCOMING', label: `Sắp tới (${stats.upcoming})` },
              { id: 'COMPLETED', label: `Đã xong (${stats.completed})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as FilterStatus)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : tab.highlight
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Lọc hình thức: Trực tuyến / Trực tiếp */}
          <div className="flex items-center gap-2">
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as typeof formatFilter)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="ALL">Mọi hình thức</option>
              <option value="ONLINE">Trực tuyến (Online)</option>
              <option value="OFFLINE">Trực tiếp (Tại văn phòng)</option>
            </select>
          </div>
        </div>

        {/* Tìm kiếm & Date Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <label htmlFor={searchInputId} className="sr-only">
              Tìm kiếm buổi phỏng vấn
            </label>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên ứng viên, vị trí tuyển dụng, phòng ban, vòng phỏng vấn..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-indigo-500"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-xs text-rose-600 hover:underline shrink-0 font-bold px-1"
              >
                Xóa ngày
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. CHẾ ĐỘ XEM LỊCH TUẦN TRỰC QUAN (AC 1: Calendar View) */}
      {viewMode === 'CALENDAR' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Header điều hướng tuần */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Tuần: {currentWeekDays[0]?.dayNumber}/{currentWeekDays[0]?.month} - {currentWeekDays[6]?.dayNumber}/{currentWeekDays[6]?.month}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedCalendarDate(new Date())}
                className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition"
              >
                Về hôm nay
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const prev = new Date(selectedCalendarDate);
                  prev.setDate(prev.getDate() - 7);
                  setSelectedCalendarDate(prev);
                }}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                title="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = new Date(selectedCalendarDate);
                  next.setDate(next.getDate() + 7);
                  setSelectedCalendarDate(next);
                }}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                title="Tuần tới"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lưới các ngày trong tuần */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {currentWeekDays.map((day) => {
              const isSelected = dateFilter === day.dateStr;
              return (
                <div
                  key={day.dateStr}
                  onClick={() => setDateFilter(dateFilter === day.dateStr ? '' : day.dateStr)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    day.isToday
                      ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-200'
                      : isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`text-xs font-semibold ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {day.dayName}
                  </div>
                  <div
                    className={`text-lg font-black my-0.5 ${
                      isSelected ? 'text-white' : day.isToday ? 'text-indigo-600' : 'text-slate-800'
                    }`}
                  >
                    {day.dayNumber}
                  </div>
                  <div className="mt-1">
                    {day.interviewsCount > 0 ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSelected
                            ? 'bg-white text-indigo-700'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {day.interviewsCount} buổi
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Trống lịch</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. DANH SÁCH THẺ BUỔI PHỎNG VẤN (AC 1: Cards View) */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
          <p className="text-sm font-semibold">Đang tải lịch phỏng vấn cá nhân...</p>
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">Không tìm thấy buổi phỏng vấn nào</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Không có lịch phỏng vấn nào phù hợp với bộ lọc hiện tại của bạn. Thử xóa bớt bộ lọc hoặc chọn ngày khác.
          </p>
          {(statusFilter !== 'ALL' || formatFilter !== 'ALL' || dateFilter || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setFormatFilter('ALL');
                setDateFilter('');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
            >
              Đặt lại toàn bộ bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((item) => {
            const isToday = item.interviewDate === todayVN;
            const isPast = checkIsPastInterview(item);
            const isNeedEvaluation = isPast && !item.isEvaluationSubmitted;
            const isCompletedEvaluation = item.isEvaluationSubmitted;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 transition-all shadow-xs ${
                  isNeedEvaluation
                    ? 'border-amber-300 ring-2 ring-amber-100/80 bg-gradient-to-r from-amber-50/15 via-white to-white'
                    : isToday
                    ? 'border-indigo-300 ring-2 ring-indigo-100/70 bg-gradient-to-r from-indigo-50/15 via-white to-white'
                    : isCompletedEvaluation
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  {/* Left Column: Khung thời gian & Chi tiết buổi phỏng vấn */}
                  <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                    {/* Hộp ngày giờ trực quan (Asia/Ho_Chi_Minh) */}
                    <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center shrink-0 p-1.5 shadow-2xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                        {isToday ? 'Hôm nay' : item.interviewDate.slice(5)}
                      </span>
                      <span className="text-base sm:text-xl font-black text-slate-900 leading-tight my-0.5">
                        {item.interviewTime}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold truncate">
                        {item.durationMinutes} phút
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        đến {calculateEndTime(item.interviewTime, item.durationMinutes)}
                      </span>
                    </div>

                    {/* Thông tin Ứng viên, Vị trí tuyển dụng, Phòng ban, Vòng phỏng vấn (AC 1) */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Tên ứng viên & Các Badge trạng thái */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 hover:text-indigo-600 transition truncate">
                          {item.candidateName}
                        </h3>

                        {/* Vòng phỏng vấn */}
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.roundName || item.interviewRound}
                        </span>

                        {isToday && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-100 text-amber-900 uppercase">
                            Hôm nay
                          </span>
                        )}

                        {/* CỜ CẢNH BÁO: CHƯA NỘP PHIẾU ĐÁNH GIÁ (AC 2) */}
                        {isNeedEvaluation && (
                          <span
                            data-testid="badge-pending-evaluation"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-black rounded-lg bg-amber-50 text-amber-800 border border-amber-300 ring-2 ring-amber-100 shadow-2xs animate-pulse"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Chưa nộp phiếu đánh giá
                          </span>
                        )}

                        {/* Đã nộp phiếu đánh giá */}
                        {isCompletedEvaluation && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đã nộp phiếu đánh giá
                            {item.evaluationScore && ` (${item.evaluationScore}/5.0)`}
                          </span>
                        )}

                        <CandidateResponseStatus response={item.candidateResponse} />
                      </div>

                      {/* Vị trí tuyển dụng & Phòng ban */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Vị trí: <strong className="text-slate-800">{item.jobTitle || 'Chuyên viên'}</strong></span>
                        </div>
                        {item.departmentName && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Phòng ban: <strong className="text-slate-800">{item.departmentName}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Khung giờ chuẩn theo múi giờ Asia/Ho_Chi_Minh & Địa điểm / Liên kết họp */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-600">
                        {/* Thời gian bắt đầu và kết thúc (AC 1) */}
                        <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          {formatTimeSlotVN(item.interviewTime, item.durationMinutes)} (GMT+7)
                        </span>

                        {/* Hình thức & Link/Địa chỉ */}
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          {item.format === 'ONLINE' ? (
                            <>
                              <Video className="w-3.5 h-3.5 text-blue-600" />
                              Trực tuyến
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              Trực tiếp
                            </>
                          )}
                        </span>

                        <span className="truncate max-w-xs font-mono text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700">
                          {item.locationOrLink}
                        </span>

                        {/* Nút sao chép link họp trực tuyến */}
                        {item.format === 'ONLINE' && item.locationOrLink.startsWith('http') && (
                          <button
                            type="button"
                            onClick={() => handleCopyMeetingLink(item.id || '', item.locationOrLink)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            {copiedId === item.id ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                                <Check className="w-3 h-3" /> Đã sao chép
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5">
                                <Copy className="w-3 h-3" /> Sao chép link
                              </span>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Hội đồng phỏng vấn (Co-interviewers) */}
                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Hội đồng:</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.interviewers.map((inv) => {
                            const isMe = inv.id === interviewerId;
                            return (
                              <span
                                key={inv.id}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                  isMe
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {inv.name} {isMe && '(Bạn)'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: CÁC NÚT THAO TÁC NHANH (Xem CV, Đánh giá năng lực, Vào phòng họp) (AC 2) */}
                  <div className="flex flex-wrap lg:flex-col items-stretch lg:items-end justify-between gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* LIÊN KẾT MỞ XEM TRƯỚC CV ỨNG VIÊN (AC 2) */}
                      <button
                        type="button"
                        onClick={() => setPreviewCvInterview(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer shadow-2xs"
                        title="Xem trước tệp CV của ứng viên ngay trong hệ thống"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        Xem trước CV
                      </button>

                      {/* NÚT ĐÁNH GIÁ NĂNG LỰC / NỘP PHIẾU ĐÁNH GIÁ (AC 2) */}
                      <button
                        type="button"
                        onClick={() => setEvaluatingInterview(item)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs ${
                          isNeedEvaluation
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 ring-2 ring-amber-300'
                            : isCompletedEvaluation
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        {isNeedEvaluation ? 'Nộp phiếu đánh giá ngay' : isCompletedEvaluation ? 'Xem lại đánh giá' : 'Đánh giá năng lực'}
                      </button>

                      {/* Nút vào phòng họp trực tuyến nếu là Online */}
                      {item.format === 'ONLINE' && item.locationOrLink.startsWith('http') && (
                        <a
                          href={item.locationOrLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black text-white shadow-xs transition"
                        >
                          <Video className="w-3.5 h-3.5 text-blue-400" />
                          Vào phòng họp <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                    </div>

                    {/* Chi tiết hồ sơ ứng viên */}
                    <div className="flex items-center gap-2">
                      {item.candidateId && (
                        <button
                          type="button"
                          onClick={() => navigate(`/candidates/${item.candidateId}`)}
                          className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Hồ sơ chi tiết ứng viên
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ghi chú buổi phỏng vấn nếu có */}
                {item.notes && (
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-xs text-slate-600 italic bg-slate-50/80 p-3 rounded-2xl">
                    <span className="font-bold text-slate-700 not-italic">Lưu ý chuyên môn: </span>
                    &quot;{item.notes}&quot;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. MODAL XEM TRƯỚC CV ỨNG VIÊN (AC 2: CV Link & In-App Preview) */}
      {previewCvInterview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cv-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          {/* Backdrop mờ */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setPreviewCvInterview(null)}
          />

          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="modal-cv-title" className="text-base sm:text-lg font-black text-slate-900">
                    Xem trước CV: {previewCvInterview.candidateName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vị trí ứng tuyển: <strong className="text-slate-700">{previewCvInterview.jobTitle}</strong> • {previewCvInterview.departmentName || 'Hệ thống'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadCv(previewCvInterview)}
                  disabled={isDownloadingCv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  <Download className={`w-3.5 h-3.5 ${isDownloadingCv ? 'animate-bounce' : ''}`} />
                  Tải CV
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCvInterview(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: CV Preview Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
                {/* CV Header Simulation */}
                <div className="border-b border-slate-200 pb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                        {previewCvInterview.candidateName}
                      </h2>
                      <p className="text-sm font-semibold text-indigo-600 mt-0.5">
                        {previewCvInterview.jobTitle}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>Email: {previewCvInterview.candidateEmail || 'ungvien@email.com'}</p>
                      <p>Hồ sơ đính kèm: {previewCvInterview.cvFileName || 'CV_Candidate_2026.pdf'}</p>
                    </div>
                  </div>
                </div>

                {/* Section: Tóm tắt năng lực */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    1. Tóm tắt năng lực chuyên môn
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    Ứng viên có trên 5 năm kinh nghiệm thực chiến phát triển các giải pháp Web Application doanh nghiệp bằng React, TypeScript và Tailwind CSS. Nắm vững tư duy kiến trúc giao diện, tối ưu Core Web Vitals và làm việc theo quy trình Agile/Scrum.
                  </p>
                </div>

                {/* Section: Kinh nghiệm làm việc gần nhất */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. Kinh nghiệm làm việc
                  </h4>
                  <div className="space-y-3">
                    <div className="border-l-2 border-indigo-500 pl-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">Senior Frontend Engineer</span>
                        <span className="text-xs text-slate-500">2023 - Hiện tại</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Dẫn dắt phát triển kiến trúc Micro-Frontend, chuẩn hóa thư viện UI Design System nội bộ giúp tăng tốc độ triển khai tính năng lên 40%.
                      </p>
                    </div>
                    <div className="border-l-2 border-slate-300 pl-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">Frontend Developer</span>
                        <span className="text-xs text-slate-500">2021 - 2023</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Phát triển các module quản lý phân quyền, xử lý dữ liệu biểu đồ phân tích và tối ưu bundle Vite/React.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section: Kỹ năng công nghệ */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    3. Kỹ năng kỹ thuật chính
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['React 19', 'TypeScript', 'Tailwind CSS', 'Vite', 'State Management (Zustand)', 'RESTful API', 'Git Flow', 'CI/CD'].map((skill) => (
                      <span key={skill} className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer preview note */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Trang xem trước tệp CV an toàn • Smart Recruitment System</span>
                  {previewCvInterview.candidateId && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/candidates/${previewCvInterview.candidateId}`);
                        setPreviewCvInterview(null);
                      }}
                      className="text-indigo-600 hover:underline font-bold"
                    >
                      Mở trang hồ sơ đầy đủ &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 px-6 py-3.5 bg-white flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewCvInterview(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = previewCvInterview;
                  setPreviewCvInterview(null);
                  setEvaluatingInterview(target);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-xs"
              >
                <Award className="w-3.5 h-3.5" />
                Vào đánh giá ứng viên này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL PHIẾU ĐÁNH GIÁ NĂNG LỰC PHỎNG VẤN (Tích hợp InterviewEvaluationModal) */}
      {evaluatingInterview && (
        <InterviewEvaluationModal
          isOpen={true}
          onClose={() => setEvaluatingInterview(null)}
          candidateId={evaluatingInterview.candidateId}
          candidateName={evaluatingInterview.candidateName}
          candidateEmail={evaluatingInterview.candidateEmail}
          jobTitle={evaluatingInterview.jobTitle || 'Chức danh tuyển dụng'}
          interviewRound={evaluatingInterview.roundName || evaluatingInterview.interviewRound}
          interviewDate={evaluatingInterview.interviewDate}
          interviewTime={evaluatingInterview.interviewTime}
          interviewFormat={evaluatingInterview.format}
          locationOrLink={evaluatingInterview.locationOrLink}
          interviewerNames={evaluatingInterview.interviewers?.map((inv) => inv.name) || [interviewerName]}
          interviewerIds={
            evaluatingInterview.interviewerIds ||
            evaluatingInterview.interviewers?.map((inv) => inv.id) ||
            [interviewerId]
          }
          interviewers={evaluatingInterview.interviewers}
          currentUserId={interviewerId}
          currentUserEmail={interviewerEmail}
          currentUserRoles={currentUser?.roles}
          frameworkName={`Khung năng lực ${evaluatingInterview.jobTitle || 'Chuyên môn'}`}
          frameworkCode="CF-STD-2026"
          frameworkVersion="v1.0"
          criteria={resolveEvaluationCriteriaForJob(evaluatingInterview.jobTitle)}
          onSubmit={(evaluationData) => {
            const evalKey = `${LOCAL_STORAGE_EVALUATION_PREFIX}${evaluatingInterview.id}_${interviewerId}`;
            localStorage.setItem(evalKey, JSON.stringify(evaluationData));

            // Cập nhật trạng thái ngay trên danh sách hiện tại
            setInterviews((prev) =>
              prev.map((item) =>
                item.id === evaluatingInterview.id
                  ? {
                      ...item,
                      isEvaluationSubmitted: true,
                      status: 'COMPLETED',
                      evaluationScore: evaluationData.calculatedTotalScore ?? undefined,
                    }
                  : item,
              ),
            );

            addToast({
              message: `Đã hoàn tất đánh giá và nộp phiếu cho ứng viên ${evaluatingInterview.candidateName}${
                evaluationData.calculatedTotalScore !== null
                  ? ` (Điểm: ${evaluationData.calculatedTotalScore}/5.0)`
                  : ''
              }.`,
              type: 'success',
            });
            setEvaluatingInterview(null);
          }}
          onSaveDraft={() => {
            addToast({
              message: `Đã lưu bản nháp đánh giá cho ứng viên ${evaluatingInterview.candidateName}.`,
              type: 'success',
            });
            setEvaluatingInterview(null);
          }}
        />
      )}
    </div>
  );
};

export default InterviewerCalendarPage;

