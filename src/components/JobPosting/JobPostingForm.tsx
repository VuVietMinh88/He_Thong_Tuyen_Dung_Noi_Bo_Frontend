import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  FileText,
  Eye,
  Save,
  Send,
  Sparkles,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  ArrowLeft,
  Tag,
  CheckCheck,
} from 'lucide-react';
import { ToastContext } from '../notifications/ToastContext';
import {
  jobPostingService,
  validateJobPostingForm,
  mapRequisitionToJobPosting,
  type JobPostingData,
  type SalaryType,
  type ValidationErrors,
} from '../../services/jobPostingService';
import {
  businessService,
  type Department,
  type Position,
  type Requisition,
} from '../../services/business.service';

export interface JobPostingFormProps {
  initialData?: Partial<JobPostingData>;
  onSuccess?: (savedData: JobPostingData) => void;
  onCancel?: () => void;
}

// Preset mẫu tin tuyển dụng nhanh (Quick Templates)
interface PresetTemplate {
  label: string;
  role: string;
  data: Partial<JobPostingData>;
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    label: '🚀 Frontend Developer (React/TS)',
    role: 'Frontend',
    data: {
      title: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
      positionTitle: 'Frontend Developer',
      level: 'SENIOR',
      employmentType: 'FULL_TIME',
      workLocation: 'Hà Nội',
      salaryType: 'RANGE',
      salaryMin: 25,
      salaryMax: 45,
      currency: 'VND',
      headcount: 2,
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'RESTful API', 'Git'],
      jobDescription: `- Tham gia phát triển và tối ưu hóa giao diện ứng dụng web Single Page Application (SPA) quy mô lớn.
- Phối hợp chặt chẽ với UI/UX Designer và Backend team để hiện thực hóa tính năng theo Agile/Scrum.
- Tối ưu hóa hiệu năng render, Core Web Vitals, bảo đảm responsive hoàn hảo trên mọi thiết bị.
- Tham gia code review, chia sẻ kiến thức kỹ thuật và chuẩn hóa design system cho team frontend.`,
      requirements: `- Tối thiểu 3 năm kinh nghiệm làm việc chuyên sâu với React và TypeScript.
- Thành thạo kiến trúc State Management, React Hooks, Tailwind CSS và bundling tools (Vite/Webpack).
- Có tư duy tốt về tối ưu UI/UX, Component Architecture và Clean Code.
- Kỹ năng giao tiếp tốt, chủ động trong công việc và có tinh thần trách nhiệm cao.`,
      benefits: `- Mức lương cạnh tranh từ 25 - 45 triệu VNĐ cùng thưởng dự án định kỳ.
- Thưởng tháng lương thứ 13, thưởng hiệu quả công việc và xét tăng lương 2 lần/năm.
- Bảo hiểm sức khỏe cao cấp (PVI/Bảo Việt), khám sức khỏe tổng quát định kỳ hàng năm.
- Môi trường làm việc trẻ trung, trang bị MacBook Pro / màn hình 4K theo yêu cầu.
- Du lịch nghỉ dưỡng thường niên, teambuilding hàng quý, hỗ trợ học phí chứng chỉ quốc tế.`,
    },
  },
  {
    label: '⚙️ Backend Developer (Node.js/Go)',
    role: 'Backend',
    data: {
      title: 'Backend Engineer (Node.js, PostgreSQL, Microservices)',
      positionTitle: 'Backend Developer',
      level: 'MIDDLE',
      employmentType: 'FULL_TIME',
      workLocation: 'TP. Hồ Chí Minh',
      salaryType: 'RANGE',
      salaryMin: 20,
      salaryMax: 35,
      currency: 'VND',
      headcount: 3,
      skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Microservices', 'REST API'],
      jobDescription: `- Thiết kế và xây dựng các dịch vụ RESTful API chịu tải cao và bảo mật.
- Tối ưu cơ sở dữ liệu quan hệ PostgreSQL, thiết kế index và giải quyết bài toán hiệu năng truy vấn.
- Triển khai và giám sát hệ thống trên nền tảng Docker, Kubernetes và Cloud (AWS/GCP).
- Tham gia thiết kế kiến trúc Microservices và luồng dữ liệu bất đồng bộ với Message Queue.`,
      requirements: `- Từ 2 năm kinh nghiệm phát triển backend với Node.js (NestJS/Express) hoặc Go.
- Nắm vững kiến thức về RDBMS (PostgreSQL/MySQL), NoSQL và Caching (Redis).
- Hiểu biết sâu về Authentication (JWT/OAuth2), API Security và xử lý Transaction an toàn.
- Có kinh nghiệm làm việc với Docker, CI/CD pipeline là một lợi thế lớn.`,
      benefits: `- Thu nhập hấp dẫn từ 20 - 35 triệu VNĐ thỏa thuận theo năng lực.
- Gói bảo hiểm chăm sóc sức khỏe toàn diện cho bản thân và người thân.
- Phụ cấp ăn trưa, gửi xe, trà chiều và hoa quả mỗi ngày tại văn phòng.
- Cơ hội làm việc cùng đội ngũ kỹ sư giàu kinh nghiệm trong các dự án công nghệ lớn.`,
    },
  },
  {
    label: '💼 Chuyên viên Tuyển dụng (Recruiter/HR)',
    role: 'HR',
    data: {
      title: 'Talent Acquisition Specialist / Chuyên viên Tuyển dụng Nhân tài',
      positionTitle: 'Chuyên viên Tuyển dụng',
      level: 'MIDDLE',
      employmentType: 'FULL_TIME',
      workLocation: 'Hà Nội',
      salaryType: 'RANGE',
      salaryMin: 15,
      salaryMax: 25,
      currency: 'VND',
      headcount: 1,
      skills: ['Talent Acquisition', 'Sourcing', 'Interviewing', 'Employer Branding', 'HR Tech'],
      jobDescription: `- Lập kế hoạch và trực tiếp triển khai tìm kiếm, săn tìm nhân tài (đặc biệt khối Tech/Product).
- Sàng lọc CV, phỏng vấn sơ loại, phối hợp với Hiring Manager tổ chức các vòng phỏng vấn chuyên môn.
- Chăm sóc trải nghiệm ứng viên chu đáo từ lúc ứng tuyển đến khi onboarding thành công.
- Đóng góp xây dựng thương hiệu nhà tuyển dụng (Employer Branding) và mở rộng mạng lưới nguồn ứng viên.`,
      requirements: `- Từ 2 năm kinh nghiệm làm tuyển dụng, ưu tiên có kinh nghiệm Headhunt hoặc Tech Recruiter.
- Kỹ năng giao tiếp, đàm phán và thuyết phục ứng viên xuất sắc.
- Khả năng sử dụng linh hoạt các kênh sourcing: LinkedIn, TopCV, Facebook Groups, GitHub.
- Năng động, nhạy bén và có tinh thần cầu tiến.`,
      benefits: `- Mức lương cứng 15 - 25 triệu VNĐ + Thưởng hiệu quả tuyển dụng theo quý hấp dẫn.
- Chế độ đãi ngộ đầy đủ theo quy định của Luật Lao động (BHXH, BHYT, phép năm).
- Tham gia các khóa đào tạo nâng cao kỹ năng tuyển dụng và quản trị nhân sự hiện đại.`,
    },
  },
];

export const JobPostingForm: React.FC<JobPostingFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  // Tab chế độ: Biểu mẫu soạn thảo hoặc Xem trước (Live Preview)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Metadata danh mục hệ thống
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Danh sách yêu cầu tuyển dụng đã duyệt (AC1 - Task TKNHTTDNB1-301)
  const [approvedRequisitions, setApprovedRequisitions] = useState<Requisition[]>([]);
  const [isLoadingApproved, setIsLoadingApproved] = useState<boolean>(false);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string>(
    initialData?.requisitionId || ''
  );
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const toastContext = useContext(ToastContext);

  // Dữ liệu Form
  const [formData, setFormData] = useState<JobPostingData>({
    id: initialData?.id,
    requisitionId: initialData?.requisitionId,
    title: initialData?.title || '',
    positionTitle: initialData?.positionTitle || '',
    departmentId: initialData?.departmentId || '',
    departmentName: initialData?.departmentName || '',
    workLocation: initialData?.workLocation || 'Hà Nội',
    employmentType: initialData?.employmentType || 'FULL_TIME',
    level: initialData?.level || 'MIDDLE',
    headcount: initialData?.headcount || 1,
    deadline: initialData?.deadline || '',
    salaryType: initialData?.salaryType || 'RANGE',
    salaryMin: initialData?.salaryMin ?? 20,
    salaryMax: initialData?.salaryMax ?? 35,
    currency: initialData?.currency || 'VND',
    isSalaryNegotiable: initialData?.isSalaryNegotiable ?? false,
    jobDescription: initialData?.jobDescription || '',
    requirements: initialData?.requirements || '',
    benefits: initialData?.benefits || '',
    skills: initialData?.skills || ['React', 'TypeScript'],
    status: initialData?.status || 'PUBLISHED',
    publishInternal: initialData?.publishInternal ?? true,
    publishCareerPage: initialData?.publishCareerPage ?? true,
  });

  // Quản lý tag kỹ năng
  const [skillInput, setSkillInput] = useState('');

  // Trạng thái xử lý & Lỗi
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper thông báo đồng bộ Toast Context (Global) & Inline Alert (Local) (AC3)
  const showNotify = useCallback(
    (text: string, type: 'success' | 'error' = 'success') => {
      setToastMessage({ type, text });
      if (toastContext?.notify) {
        toastContext.notify(text, type);
      }
    },
    [toastContext]
  );

  // 1. Tải danh sách phòng ban, chức danh và yêu cầu đã duyệt từ hệ thống
  useEffect(() => {
    let isMounted = true;
    setIsLoadingApproved(true);

    Promise.allSettled([
      businessService.getDepartments(0),
      businessService.getPositions(0),
      jobPostingService.getApprovedRequisitions(),
    ]).then(([deptRes, posRes, reqRes]) => {
      if (!isMounted) return;
      const loadedDepts = deptRes.status === 'fulfilled' ? deptRes.value.items : [];
      const loadedPositions = posRes.status === 'fulfilled' ? posRes.value.items : [];
      const loadedReqs = reqRes.status === 'fulfilled' ? reqRes.value : [];

      if (deptRes.status === 'fulfilled') setDepartments(loadedDepts);
      if (posRes.status === 'fulfilled') setPositions(loadedPositions);
      if (reqRes.status === 'fulfilled') setApprovedRequisitions(loadedReqs);
      setIsLoadingApproved(false);

      // Tự động kiểm tra param ?requisitionId=... trên URL hoặc initialData
      let targetReqId = initialData?.requisitionId || '';
      try {
        if (typeof window !== 'undefined' && window.location?.search) {
          const params = new URLSearchParams(window.location.search);
          const qId = params.get('requisitionId');
          if (qId) targetReqId = qId;
        }
      } catch {
        // ignore
      }

      if (targetReqId) {
        const found = loadedReqs.find((r) => r.id === targetReqId);
        if (found) {
          const mapped = mapRequisitionToJobPosting(found, loadedPositions, loadedDepts);
          setFormData((prev) => ({
            ...prev,
            ...mapped,
            id: prev.id,
          }));
          setSelectedRequisitionId(found.id);
          showNotify(
            `Đã tự động nạp dữ liệu từ yêu cầu đã duyệt #${found.id} vào biểu mẫu!`,
            'success'
          );
        } else {
          jobPostingService.getRequisitionById(targetReqId).then((singleReq) => {
            if (singleReq && isMounted) {
              const mapped = mapRequisitionToJobPosting(singleReq, loadedPositions, loadedDepts);
              setFormData((prev) => ({
                ...prev,
                ...mapped,
                id: prev.id,
              }));
              setSelectedRequisitionId(singleReq.id);
              showNotify(
                `Đã tự động nạp dữ liệu từ yêu cầu đã duyệt #${singleReq.id} vào biểu mẫu!`,
                'success'
              );
            }
          });
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [initialData?.requisitionId, showNotify]);

  // 2. Tự động đóng toast sau 4 giây
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Cập nhật trường form và xóa lỗi inline
  const handleChange = (field: keyof JobPostingData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Áp dụng Preset Template nhanh
  const applyPresetTemplate = (preset: PresetTemplate) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.data,
    }));
    setErrors({});
    setToastMessage({
      type: 'success',
      text: `Đã áp dụng mẫu tin "${preset.label}". Bạn có thể chỉnh sửa thêm theo nhu cầu!`,
    });
  };

  // Xử lý thêm Tag Kỹ năng
  const handleAddSkill = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ',') return;
    if (e && 'preventDefault' in e) e.preventDefault();

    const cleanSkill = skillInput.trim().replace(/^,+|,+$/g, '');
    if (cleanSkill && !formData.skills.includes(cleanSkill)) {
      handleChange('skills', [...formData.skills, cleanSkill]);
      setSkillInput('');
    }
  };

  // Xóa Tag Kỹ năng
  const handleRemoveSkill = (skillToRemove: string) => {
    handleChange(
      'skills',
      formData.skills.filter((s) => s !== skillToRemove),
    );
  };

  // Xử lý nạp dữ liệu từ yêu cầu tuyển dụng đã duyệt (AC1 - Task TKNHTTDNB1-301)
  const handleSelectApprovedRequisition = useCallback(
    (req: Requisition) => {
      const mapped = mapRequisitionToJobPosting(req, positions, departments);
      setFormData((prev) => ({
        ...prev,
        ...mapped,
        id: prev.id,
      }));
      setSelectedRequisitionId(req.id);
      setErrors({});
      showNotify(
        `Đã nạp dữ liệu từ yêu cầu tuyển dụng đã duyệt #${req.id} vào biểu mẫu!`,
        'success'
      );
    },
    [positions, departments, showNotify]
  );

  // Xử lý Xuất bản tin tuyển dụng (Publish)
  const handleSubmitPublish = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra validate (AC2)
    const { isValid, errors: validationErrors } = validateJobPostingForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      setActiveTab('editor');
      showNotify(
        'Vui lòng kiểm tra và hoàn thành các trường thông tin bắt buộc còn thiếu.',
        'error'
      );

      // Scroll mượt lên đầu biểu mẫu
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const saved = await jobPostingService.createJobPosting({
        ...formData,
        requisitionId: selectedRequisitionId || formData.requisitionId,
        status: 'PUBLISHED',
      });

      showNotify('Đã xuất bản tin tuyển dụng thành công lên hệ thống!', 'success');

      if (onSuccess) onSuccess(saved);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể lưu tin tuyển dụng.';
      showNotify(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Lưu bản nháp (Save Draft - AC2 & AC3)
  const handleSaveDraft = async () => {
    let effectiveTitle = formData.title.trim();
    if (!effectiveTitle) {
      if (selectedRequisitionId) {
        effectiveTitle = `Bản nháp tin tuyển dụng (Yêu cầu #${selectedRequisitionId})`;
        setFormData((prev) => ({ ...prev, title: effectiveTitle }));
      } else {
        setErrors((prev) => ({ ...prev, title: 'Vui lòng nhập tiêu đề để có thể lưu bản nháp.' }));
        showNotify('Cần nhập ít nhất tiêu đề tin tuyển dụng để lưu nháp.', 'error');
        return;
      }
    }

    setIsSavingDraft(true);
    setToastMessage(null);

    try {
      const draft = await jobPostingService.saveDraft({
        ...formData,
        title: effectiveTitle,
        requisitionId: selectedRequisitionId || formData.requisitionId,
        status: 'DRAFT',
      });

      const nowTime = new Date().toLocaleTimeString('vi-VN');
      setLastSavedTime(nowTime);
      setFormData((prev) => ({ ...prev, id: draft.id }));
      showNotify('Đã lưu bản nháp tin tuyển dụng thành công!', 'success');

      if (onSuccess) onSuccess(draft);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể lưu bản nháp.';
      showNotify(errorMsg, 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Định dạng hiển thị mức lương
  const formatSalaryDisplay = useCallback(() => {
    if (formData.salaryType === 'NEGOTIABLE') return 'Mức lương: Thỏa thuận';
    if (formData.salaryType === 'UP_TO') {
      return `Lên đến ${formData.salaryMax || 0} triệu ${formData.currency}`;
    }
    if (formData.salaryType === 'STARTING_FROM') {
      return `Từ ${formData.salaryMin || 0} triệu ${formData.currency} trở lên`;
    }
    return `${formData.salaryMin || 0} - ${formData.salaryMax || 0} triệu ${formData.currency}`;
  }, [formData.salaryType, formData.salaryMin, formData.salaryMax, formData.currency]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex max-w-md items-center justify-between rounded-xl p-4 shadow-xl ring-1 transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 ring-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-900 ring-rose-300'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{toastMessage.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-3 text-slate-400 hover:text-slate-600"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1 hover:underline text-slate-500 hover:text-indigo-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Quay lại
              </button>
            )}
            <span>Tuyển dụng</span>
            <span>/</span>
            <span className="text-slate-800">Soạn tin tuyển dụng</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Soạn Thảo Tin Tuyển Dụng Mới
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Tạo và xuất bản thông tin tuyển dụng chuẩn mực tới ứng viên và trang nghề nghiệp.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {lastSavedTime && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-2xs">
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              Đã lưu nháp {lastSavedTime}
            </span>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              Hủy
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleSaveDraft()}
            disabled={isSavingDraft || isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
          >
            {isSavingDraft ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
            ) : (
              <Save className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>Lưu bản nháp</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitPublish}
            disabled={isSubmitting || isSavingDraft}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-98 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Đăng tin tuyển dụng</span>
          </button>
        </div>
      </div>

      {/* Approved Requisitions Integration Card (AC1 - Task TKNHTTDNB1-301) */}
      <div className="rounded-2xl border border-emerald-200/80 bg-linear-to-r from-emerald-50/90 to-teal-50/40 p-4 shadow-2xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Nạp dữ liệu từ Yêu cầu tuyển dụng đã duyệt
                </span>
                {selectedRequisitionId ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Đã liên kết #{selectedRequisitionId}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    Chưa liên kết
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600">
                Tự động lấy chức danh, phòng ban, dải lương và mô tả từ yêu cầu đã được phê duyệt để điền sẵn vào biểu mẫu.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Chọn yêu cầu tuyển dụng đã duyệt"
              value={selectedRequisitionId}
              onChange={(e) => {
                const reqId = e.target.value;
                if (!reqId) {
                  setSelectedRequisitionId('');
                  return;
                }
                const found = approvedRequisitions.find((r) => r.id === reqId);
                if (found) {
                  handleSelectApprovedRequisition(found);
                }
              }}
              disabled={isLoadingApproved}
              className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-emerald-500 focus:outline-hidden max-w-sm truncate"
            >
              <option value="">
                {isLoadingApproved
                  ? 'Đang tải yêu cầu đã duyệt...'
                  : approvedRequisitions.length === 0
                  ? 'Không có yêu cầu đã duyệt nào'
                  : '-- Chọn yêu cầu đã duyệt để điền form --'}
              </option>
              {approvedRequisitions.map((req) => {
                const pos = positions.find((p) => p.id === req.positionId);
                const dept = departments.find((d) => d.id === req.departmentId);
                return (
                  <option key={req.id} value={req.id}>
                    #{req.id} - {pos?.name || req.positionId} ({dept?.name || req.departmentId}) - {req.headcount} nhân sự
                  </option>
                );
              })}
            </select>

            {selectedRequisitionId && (
              <button
                type="button"
                onClick={() => {
                  const found = approvedRequisitions.find((r) => r.id === selectedRequisitionId);
                  if (found) handleSelectApprovedRequisition(found);
                }}
                className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Đồng bộ lại dữ liệu từ yêu cầu đã duyệt này"
              >
                Đồng bộ lại
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preset Templates Banner (AC3 - Tiện ích soạn nhanh) */}
      <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50/70 to-blue-50/40 p-4 shadow-2xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">
                Soạn tin nhanh theo mẫu chuẩn (Quick Templates)
              </span>
              <p className="text-[11px] text-slate-500">
                Chọn một mẫu chức danh phổ biến để tự động điền cấu trúc JD chuẩn mực:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESET_TEMPLATES.map((preset) => (
              <button
                key={preset.role}
                type="button"
                onClick={() => applyPresetTemplate(preset)}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Biểu mẫu / Xem trước - AC3) */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'editor'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Biểu mẫu soạn thảo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'preview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Xem trước trực tiếp (Live Preview)</span>
          {formData.title && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* TAB CONTENT 1: BIỂU MẪU SOẠN THẢO */}
      {activeTab === 'editor' ? (
        <form onSubmit={handleSubmitPublish} className="space-y-6">
          {/* KHỐI 1: THÔNG TIN TỔNG QUAN VỊ TRÍ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                1. Thông tin chung về vị trí tuyển dụng
              </h2>
              <p className="text-xs text-slate-500">
                Thiết lập tiêu đề, phòng ban, địa điểm làm việc và hạn nhận hồ sơ.
              </p>
            </div>

            {/* Tiêu đề tin tuyển dụng */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="post-title" className="block text-xs font-semibold text-slate-700">
                  Tiêu đề tin tuyển dụng <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {formData.title.length}/150 ký tự
                </span>
              </div>
              <input
                id="post-title"
                type="text"
                required
                maxLength={150}
                placeholder="VD: Senior Frontend Developer (React, TypeScript & Tailwind CSS)"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 ${
                  errors.title
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.title && <p className="mt-1 text-[11px] text-rose-600">{errors.title}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Chức danh tuyển dụng */}
              <div>
                <label htmlFor="post-position" className="block text-xs font-semibold text-slate-700">
                  Chức danh / Vị trí <span className="text-rose-500">*</span>
                </label>
                <input
                  id="post-position"
                  list="positions-list"
                  required
                  placeholder="Chọn hoặc nhập chức danh..."
                  value={formData.positionTitle}
                  onChange={(e) => handleChange('positionTitle', e.target.value)}
                  className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 focus:ring-1 ${
                    errors.positionTitle
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                <datalist id="positions-list">
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.name}>
                      {pos.code} - {pos.level}
                    </option>
                  ))}
                </datalist>
                {errors.positionTitle && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.positionTitle}</p>
                )}
              </div>

              {/* Phòng ban phụ trách */}
              <div>
                <label htmlFor="post-department" className="block text-xs font-semibold text-slate-700">
                  Phòng ban <span className="text-rose-500">*</span>
                </label>
                <select
                  id="post-department"
                  required
                  value={formData.departmentId}
                  onChange={(e) => {
                    const dept = departments.find((d) => d.id === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      departmentId: e.target.value,
                      departmentName: dept?.name || '',
                    }));
                    if (errors.departmentId) {
                      setErrors((prev) => ({ ...prev, departmentId: undefined }));
                    }
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2 text-xs text-slate-900 focus:ring-1 ${
                    errors.departmentId
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.departmentId && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.departmentId}</p>
                )}
              </div>

              {/* Cấp bậc */}
              <div>
                <label htmlFor="post-level" className="block text-xs font-semibold text-slate-700">
                  Cấp bậc yêu cầu <span className="text-rose-500">*</span>
                </label>
                <select
                  id="post-level"
                  required
                  value={formData.level}
                  onChange={(e) => handleChange('level', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="INTERN">Thực tập sinh (Intern)</option>
                  <option value="FRESHER">Mới tốt nghiệp (Fresher)</option>
                  <option value="JUNIOR">Junior (1 - 2 năm)</option>
                  <option value="MIDDLE">Middle (2 - 4 năm)</option>
                  <option value="SENIOR">Senior (4+ năm)</option>
                  <option value="LEAD">Trưởng nhóm (Team Lead)</option>
                  <option value="MANAGER">Quản lý (Manager)</option>
                </select>
              </div>

              {/* Địa điểm làm việc */}
              <div>
                <label htmlFor="post-location" className="block text-xs font-semibold text-slate-700">
                  Địa điểm làm việc <span className="text-rose-500">*</span>
                </label>
                <select
                  id="post-location"
                  required
                  value={formData.workLocation}
                  onChange={(e) => handleChange('workLocation', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Hà Nội">Hà Nội (Trụ sở chính)</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh (Chi nhánh)</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="Remote">Làm việc từ xa (Remote 100%)</option>
                  <option value="Hybrid">Kết hợp linh hoạt (Hybrid)</option>
                </select>
              </div>

              {/* Hình thức làm việc */}
              <div>
                <label htmlFor="post-jobtype" className="block text-xs font-semibold text-slate-700">
                  Hình thức làm việc <span className="text-rose-500">*</span>
                </label>
                <select
                  id="post-jobtype"
                  required
                  value={formData.employmentType}
                  onChange={(e) => handleChange('employmentType', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
                  <option value="PART_TIME">Bán thời gian (Part-time)</option>
                  <option value="CONTRACT">Hợp đồng dự án (Contract)</option>
                  <option value="INTERNSHIP">Thực tập (Internship)</option>
                </select>
              </div>

              {/* Số lượng & Hạn nộp */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="post-headcount" className="block text-xs font-semibold text-slate-700">
                    Số lượng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="post-headcount"
                    type="number"
                    min="1"
                    required
                    value={formData.headcount}
                    onChange={(e) => handleChange('headcount', parseInt(e.target.value) || 1)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="post-deadline" className="block text-xs font-semibold text-slate-700">
                    Hạn nộp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="post-deadline"
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => handleChange('deadline', e.target.value)}
                    className={`mt-1.5 w-full rounded-xl border px-2 py-2 text-xs text-slate-900 focus:ring-1 ${
                      errors.deadline
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
              </div>
            </div>
            {errors.deadline && <p className="text-[11px] text-rose-600">{errors.deadline}</p>}
          </div>

          {/* KHỐI 2: MỨC LƯƠNG & CHẾ ĐỘ ĐÃI NGỘ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                2. Chế độ lương & Đãi ngộ
              </h2>
              <p className="text-xs text-slate-500">
                Quy định mức lương hiển thị hấp dẫn giúp tăng tỷ lệ nộp hồ sơ của ứng viên.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Loại mức lương */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Loại mức lương</label>
                <select
                  value={formData.salaryType}
                  onChange={(e) => handleChange('salaryType', e.target.value as SalaryType)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="RANGE">Khoảng lương (Từ - Đến)</option>
                  <option value="UP_TO">Lên đến (Tối đa)</option>
                  <option value="STARTING_FROM">Khởi điểm từ (Tối thiểu)</option>
                  <option value="NEGOTIABLE">Thỏa thuận (Cạnh tranh)</option>
                </select>
              </div>

              {/* Lương tối thiểu */}
              {formData.salaryType !== 'NEGOTIABLE' && formData.salaryType !== 'UP_TO' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Lương tối thiểu (triệu {formData.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.salaryMin ?? ''}
                    onChange={(e) =>
                      handleChange('salaryMin', e.target.value === '' ? undefined : parseFloat(e.target.value))
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Lương tối đa */}
              {formData.salaryType !== 'NEGOTIABLE' && formData.salaryType !== 'STARTING_FROM' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Lương tối đa (triệu {formData.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.salaryMax ?? ''}
                    onChange={(e) =>
                      handleChange('salaryMax', e.target.value === '' ? undefined : parseFloat(e.target.value))
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Đơn vị tiền tệ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Đơn vị tiền tệ</label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value as 'VND' | 'USD')}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="VND">VNĐ (Việt Nam Đồng)</option>
                  <option value="USD">USD (Đô la Mỹ)</option>
                </select>
              </div>
            </div>

            {errors.salary && <p className="text-[11px] text-rose-600">{errors.salary}</p>}

            {/* Checkbox Hiển thị công khai lương */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="post-salary-public"
                type="checkbox"
                checked={!formData.isSalaryNegotiable}
                onChange={(e) => handleChange('isSalaryNegotiable', !e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="post-salary-public"
                className="text-xs font-medium text-slate-700 cursor-pointer select-none"
              >
                Hiển thị số liệu mức lương công khai trên tin đăng tuyển dụng (Tin có mức lương nhận được lượng nộp gấp 2 lần)
              </label>
            </div>
          </div>

          {/* KHỐI 3: NỘI DUNG CHI TIẾT TIN TUYỂN DỤNG (JD) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                3. Nội dung mô tả chi tiết công việc (Job Description)
              </h2>
              <p className="text-xs text-slate-500">
                Trình bày rõ ràng trách nhiệm, yêu cầu năng lực và các chế độ quyền lợi hấp dẫn.
              </p>
            </div>

            {/* Mô tả công việc */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="post-description" className="block text-xs font-semibold text-slate-700">
                  Mô tả công việc (Trách nhiệm & Nhiệm vụ chính) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {formData.jobDescription.length} ký tự (tối thiểu 20)
                </span>
              </div>
              <textarea
                id="post-description"
                rows={5}
                required
                placeholder="- Mô tả các đầu việc chính cần thực hiện hàng ngày...&#10;- Trách nhiệm quản lý và bàn giao sản phẩm...&#10;- Tham gia đóng góp vào quy trình kỹ thuật của công ty..."
                value={formData.jobDescription}
                onChange={(e) => handleChange('jobDescription', e.target.value)}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 leading-relaxed focus:ring-1 ${
                  errors.jobDescription
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.jobDescription && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.jobDescription}</p>
              )}
            </div>

            {/* Yêu cầu ứng viên */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="post-requirements" className="block text-xs font-semibold text-slate-700">
                  Yêu cầu ứng viên (Kỹ năng, Kinh nghiệm, Học vấn) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {formData.requirements.length} ký tự (tối thiểu 20)
                </span>
              </div>
              <textarea
                id="post-requirements"
                rows={5}
                required
                placeholder="- Số năm kinh nghiệm làm việc trong lĩnh vực liên quan...&#10;- Kỹ năng chuyên môn bắt buộc và kỹ năng bổ trợ...&#10;- Bằng cấp, chứng chỉ hoặc trình độ ngoại ngữ..."
                value={formData.requirements}
                onChange={(e) => handleChange('requirements', e.target.value)}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 leading-relaxed focus:ring-1 ${
                  errors.requirements
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.requirements && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.requirements}</p>
              )}
            </div>

            {/* Quyền lợi & Đãi ngộ */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="post-benefits" className="block text-xs font-semibold text-slate-700">
                  Quyền lợi & Chế độ đãi ngộ <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {formData.benefits.length} ký tự (tối thiểu 10)
                </span>
              </div>
              <textarea
                id="post-benefits"
                rows={4}
                required
                placeholder="- Lương, thưởng định kỳ, tháng 13...&#10;- Chế độ bảo hiểm sức khỏe và khám định kỳ...&#10;- Môi trường làm việc, đào tạo và lộ trình thăng tiến..."
                value={formData.benefits}
                onChange={(e) => handleChange('benefits', e.target.value)}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 leading-relaxed focus:ring-1 ${
                  errors.benefits
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.benefits && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.benefits}</p>
              )}
            </div>
          </div>

          {/* KHỐI 4: KỸ NĂNG & KÊNH PHÁT HÀNH */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-purple-600" />
                4. Kỹ năng trọng tâm & Kênh phát hành
              </h2>
              <p className="text-xs text-slate-500">
                Gắn thẻ kỹ năng giúp tìm kiếm ứng viên chuẩn xác và chọn các kênh đăng tải phù hợp.
              </p>
            </div>

            {/* Kỹ năng Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kỹ năng trọng tâm (Nhập và nhấn Enter để thêm)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="VD: React, TypeScript, Docker..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  className="w-full max-w-sm rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm
                </button>
              </div>

              {/* Tag List */}
              <div className="mt-2.5 flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-indigo-400 hover:text-indigo-800"
                      aria-label={`Xóa tag ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Kênh phát hành */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="block text-xs font-semibold text-slate-700">Kênh phát hành tin</span>

              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.publishInternal}
                    onChange={(e) => handleChange('publishInternal', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Đăng lên Cổng thông tin nội bộ (Internal Job Board)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.publishCareerPage}
                    onChange={(e) => handleChange('publishCareerPage', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Đăng lên Trang tuyển dụng công khai (Career Page)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => void handleSaveDraft()}
              disabled={isSavingDraft || isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
            >
              Lưu bản nháp
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSavingDraft}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Đăng tin tuyển dụng</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* TAB CONTENT 2: LIVE PREVIEW (XEM TRƯỚC TRỰC QUAN - AC3) */
        <div className="space-y-6">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs text-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Chế độ xem trước (Live Preview):</strong> Đây là giao diện hiển thị thực tế của tin tuyển dụng khi ứng viên truy cập trên Cổng thông tin nghề nghiệp.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className="text-xs font-bold text-indigo-700 hover:underline shrink-0"
            >
              Chỉnh sửa nội dung &rarr;
            </button>
          </div>

          {/* Job Posting Mock Page */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Header Banner */}
            <div className="border-b border-slate-100 bg-linear-to-r from-slate-900 to-indigo-950 p-8 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-md bg-indigo-500/30 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-indigo-200 border border-indigo-400/20">
                  {formData.level}
                </span>
                <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/20">
                  {formData.employmentType === 'FULL_TIME'
                    ? 'Toàn thời gian'
                    : formData.employmentType === 'PART_TIME'
                    ? 'Bán thời gian'
                    : 'Hợp đồng'}
                </span>
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200">
                  {formData.departmentName || 'Bộ phận Kỹ thuật & Sản phẩm'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {formData.title || 'Tiêu đề tin tuyển dụng (Chưa nhập)'}
              </h1>

              {/* Thông tin Meta */}
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-white/10 pt-5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rose-400" />
                  <span>{formData.workLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-emerald-300">{formatSalaryDisplay()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>Tuyển dụng: {formData.headcount} nhân sự</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span>Hạn nộp: {formData.deadline || 'Chưa thiết lập'}</span>
                </div>
              </div>
            </div>

            {/* Body Nội dung JD */}
            <div className="p-8 space-y-8">
              {/* Kỹ năng Tags */}
              {formData.skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Kỹ năng yêu cầu
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
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
                  Mô tả công việc
                </h3>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-5 rounded-xl border border-slate-100">
                  {formData.jobDescription || (
                    <span className="italic text-slate-400">Chưa có nội dung mô tả công việc.</span>
                  )}
                </div>
              </div>

              {/* Yêu cầu ứng viên */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Yêu cầu ứng viên
                </h3>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-5 rounded-xl border border-slate-100">
                  {formData.requirements || (
                    <span className="italic text-slate-400">Chưa có yêu cầu ứng viên.</span>
                  )}
                </div>
              </div>

              {/* Quyền lợi */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Quyền lợi được hưởng
                </h3>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-5 rounded-xl border border-slate-100">
                  {formData.benefits || (
                    <span className="italic text-slate-400">Chưa có quyền lợi ứng viên.</span>
                  )}
                </div>
              </div>

              {/* Action Apply Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-xs text-slate-500">
                  Ứng tuyển ngay hôm nay để trở thành một phần của đội ngũ phát triển tài năng.
                </div>
                <button
                  type="button"
                  disabled
                  className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-md opacity-90 cursor-default"
                >
                  Nộp hồ sơ ứng tuyển
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostingForm;
