import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Plus,
  Sparkles,
  Briefcase,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Tag,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type {
  CandidateProfile,
  CreateManualCandidateDto,
} from '../../types/candidate';
import { CANDIDATE_SOURCE_CONFIG } from '../../types/candidate';
import { candidateService } from '../../services/candidateService';
import { toast } from '../notifications';

export interface ManualCandidateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCandidate: CandidateProfile, shouldClose: boolean) => void;
  jobOptions?: Array<{ id: string; title: string; departmentName?: string }>;
}

const DEFAULT_POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Tailwind CSS',
  'Node.js',
  'Next.js',
  'Python',
  'Java / Spring',
  'Golang',
  'PostgreSQL',
  'Docker',
  'Figma',
];

const DEFAULT_JOB_OPTIONS = [
  { id: 'jp-demo-306', title: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)', departmentName: 'Khối Công nghệ & Sản phẩm' },
  { id: 'jp-demo-307', title: 'Senior Backend Engineer (Java / Spring Boot & Microservices)', departmentName: 'Khối Công nghệ & Sản phẩm' },
  { id: 'jp-demo-308', title: 'Product Owner / Senior Business Analyst', departmentName: 'Khối Sản phẩm & Trải nghiệm số' },
  { id: 'jp-demo-309', title: 'Chuyên viên Tuyển dụng Cao cấp (Senior IT Recruiter)', departmentName: 'Ban Quản trị Nguồn nhân lực' },
  { id: 'jp-demo-310', title: 'Data Engineer / Big Data Specialist', departmentName: 'Trung tâm Dữ liệu & AI' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ManualCandidateCreateModal: React.FC<ManualCandidateCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  jobOptions = DEFAULT_JOB_OPTIONS,
}) => {
  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [appliedJobId, setAppliedJobId] = useState<string>('');
  const [source, setSource] = useState<string>('REFERRAL');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState<string>('');
  const [experienceYears, setExperienceYears] = useState<string>('');
  const [currentCompany, setCurrentCompany] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // CV File upload state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFilePreviewUrl, setCvFilePreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isParsingCv, setIsParsingCv] = useState<boolean>(false);

  // Validation & Submitting state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitAction, setSubmitAction] = useState<'close' | 'continue' | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);

  const activeJobOptions = jobOptions.length > 0 ? jobOptions : DEFAULT_JOB_OPTIONS;

  // Reset form when modal opens or closes
  const resetFormFields = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setDateOfBirth('');
    setAddress('');
    setAppliedJobId(activeJobOptions[0]?.id || '');
    setSource('REFERRAL');
    setSkills([]);
    setSkillInput('');
    setExperienceYears('');
    setCurrentCompany('');
    setNotes('');
    if (cvFilePreviewUrl) {
      URL.revokeObjectURL(cvFilePreviewUrl);
    }
    setCvFile(null);
    setCvFilePreviewUrl(null);
    setFileError('');
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetFormFields();
      setSuccessBanner(null);
      // Auto-select first job if not selected
      if (!appliedJobId && activeJobOptions.length > 0) {
        setAppliedJobId(activeJobOptions[0].id);
      }
    } else {
      if (cvFilePreviewUrl) {
        URL.revokeObjectURL(cvFilePreviewUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // Validate file
  const handleValidateAndSetFile = (file: File) => {
    setFileError('');

    // Check size limit (10MB)
    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `Dung lượng tệp vượt quá giới hạn 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB). Vui lòng chọn tệp nhỏ hơn.`
      );
      return false;
    }

    // Check extension
    const fileName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type);

    if (!hasValidExt && !hasValidMime) {
      setFileError('Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp PDF, DOC hoặc DOCX.');
      return false;
    }

    // Set file and preview url
    if (cvFilePreviewUrl) {
      URL.revokeObjectURL(cvFilePreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setCvFile(file);
    setCvFilePreviewUrl(previewUrl);

    // Auto extract/suggest if fields are empty
    suggestInfoFromFileName(file.name);
    return true;
  };

  // Heuristic mock parser to extract candidate name/role from filename (e.g. CV_Nguyen_Van_A_React.pdf)
  const suggestInfoFromFileName = (fileName: string) => {
    const cleanName = fileName
      .replace(/\.(pdf|docx|doc)$/i, '')
      .replace(/^(cv|resume)[_ -]*/i, '')
      .replace(/[_ -]+/g, ' ')
      .trim();

    if (cleanName && !fullName) {
      // Capitalize words
      const suggestedName = cleanName
        .split(' ')
        .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ');
      setFullName(suggestedName);
    }
  };

  // AI-Assisted Auto-fill simulation
  const handleAutoFillFromCv = () => {
    if (!cvFile) return;
    setIsParsingCv(true);

    setTimeout(() => {
      setIsParsingCv(false);
      // Smart extraction simulation
      if (!fullName) {
        setFullName('Nguyễn Văn Tuấn');
      }
      if (!email) {
        setEmail('tuan.nguyen.dev@gmail.com');
      }
      if (!phone) {
        setPhone('0912345678');
      }
      if (skills.length === 0) {
        setSkills(['React', 'TypeScript', 'Tailwind CSS', 'Next.js']);
      }
      if (!experienceYears) {
        setExperienceYears('3');
      }
      if (!currentCompany) {
        setCurrentCompany('VNPAY Technology');
      }
      toast.success(`Đã tự động trích xuất thông tin từ tệp ${cvFile.name}`);
    }, 600);
  };

  // File drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleValidateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (cvFilePreviewUrl) {
      URL.revokeObjectURL(cvFilePreviewUrl);
    }
    setCvFile(null);
    setCvFilePreviewUrl(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Skill tags management
  const handleAddSkill = (skillToAdd?: string) => {
    const raw = (skillToAdd || skillInput).trim();
    if (!raw) return;

    if (!skills.includes(raw)) {
      setSkills([...skills, raw]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Họ và tên (Bắt buộc)
    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên ứng viên';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    // 2. Email (Bắt buộc, validate format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email ứng viên';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Định dạng email không hợp lệ (ví dụ: ungvien@gmail.com)';
    }

    // 3. Số điện thoại (Bắt buộc, validate định dạng SĐT Việt Nam: 10-11 số)
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (gồm 10 chữ số, ví dụ: 0912345678)';
    }

    // 4. Vị trí ứng tuyển (Bắt buộc)
    if (!appliedJobId.trim()) {
      newErrors.appliedJobId = 'Vui lòng chọn vị trí ứng tuyển';
    }

    // 5. Nguồn ứng viên (Bắt buộc)
    if (!source.trim()) {
      newErrors.source = 'Vui lòng chọn nguồn ứng viên';
    }

    // 6. Số năm kinh nghiệm (nếu nhập phải là số hợp lệ >= 0)
    if (experienceYears && (isNaN(Number(experienceYears)) || Number(experienceYears) < 0)) {
      newErrors.experienceYears = 'Số năm kinh nghiệm phải là số không âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (action: 'close' | 'continue') => {
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại các trường thông tin bắt buộc.');
      return;
    }

    setIsSubmitting(true);
    setSubmitAction(action);

    try {
      const selectedJob = activeJobOptions.find((job) => job.id === appliedJobId);
      const selectedSourceConfig = CANDIDATE_SOURCE_CONFIG.find((s) => s.value === source);

      const payload: CreateManualCandidateDto = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth || undefined,
        address: address.trim() || undefined,
        appliedJobId: appliedJobId,
        appliedJobTitle: selectedJob?.title || 'Vị trí tuyển dụng',
        source: selectedSourceConfig?.label || source,
        skills: skills,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        currentCompany: currentCompany.trim() || undefined,
        notes: notes.trim() || undefined,
        cvFileName: cvFile?.name,
        cvFileSize: cvFile?.size,
        cvUrl: cvFilePreviewUrl || undefined,
      };

      const createdCandidate = await candidateService.createManualCandidate(payload);

      toast.success(
        `Thêm ứng viên "${createdCandidate.fullName}" thành công!${
          action === 'continue' ? ' Có thể tiếp tục nhập hồ sơ tiếp theo.' : ''
        }`
      );

      if (action === 'continue') {
        setSuccessBanner(`Đã thêm thành công ứng viên "${createdCandidate.fullName}". Sẵn sàng nhập hồ sơ mới.`);
        resetFormFields();
        if (fullNameInputRef.current) {
          fullNameInputRef.current.focus();
        }
        if (onSuccess) {
          onSuccess(createdCandidate, false);
        }
      } else {
        if (onSuccess) {
          onSuccess(createdCandidate, true);
        }
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi tạo hồ sơ ứng viên.');
    } finally {
      setIsSubmitting(false);
      setSubmitAction(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-candidate-create-modal-title"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="manual-candidate-create-modal-title"
                  className="text-lg font-bold text-gray-900 dark:text-white"
                >
                  Thêm hồ sơ ứng viên thủ công
                </h2>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  User Story S5-06
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thêm ứng viên từ nguồn giới thiệu nội bộ, email hoặc sự kiện tuyển dụng trực tiếp.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng biểu mẫu"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-hidden dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Banner thông báo tiếp tục thêm thành công */}
          {successBanner && (
            <div
              data-testid="success-banner"
              className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{successBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessBanner(null)}
                className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Section 1: Thông tin cá nhân */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                1. Thông tin cá nhân ứng viên
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Họ và tên */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="candidate-full-name"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    ref={fullNameInputRef}
                    id="candidate-full-name"
                    data-testid="input-candidate-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) {
                        setErrors((prev) => ({ ...prev, fullName: '' }));
                      }
                    }}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className={`block w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-hidden dark:bg-gray-800 dark:text-white ${
                      errors.fullName
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p
                    data-testid="error-candidate-full-name"
                    className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="candidate-email"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Email liên hệ <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="candidate-email"
                    data-testid="input-candidate-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors((prev) => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="ungvien@example.com"
                    className={`block w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-sm transition-colors focus:outline-hidden dark:bg-gray-800 dark:text-white ${
                      errors.email
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p
                    data-testid="error-candidate-email"
                    className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Số điện thoại */}
              <div>
                <label
                  htmlFor="candidate-phone"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="candidate-phone"
                    data-testid="input-candidate-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) {
                        setErrors((prev) => ({ ...prev, phone: '' }));
                      }
                    }}
                    placeholder="0912345678"
                    className={`block w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-sm transition-colors focus:outline-hidden dark:bg-gray-800 dark:text-white ${
                      errors.phone
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p
                    data-testid="error-candidate-phone"
                    className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Ngày sinh */}
              <div>
                <label
                  htmlFor="candidate-dob"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Ngày sinh
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    id="candidate-dob"
                    data-testid="input-candidate-dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 pl-9 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label
                  htmlFor="candidate-address"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Địa chỉ hiện tại
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    id="candidate-address"
                    data-testid="input-candidate-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ví dụ: Cầu Giấy, Hà Nội"
                    className="block w-full rounded-xl border border-gray-300 pl-9 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin tuyển dụng */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
              <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                2. Thông tin vị trí & Nguồn tuyển dụng
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Vị trí ứng tuyển */}
              <div>
                <label
                  htmlFor="candidate-job"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Vị trí ứng tuyển đang mở <span className="text-rose-500">*</span>
                </label>
                <select
                  id="candidate-job"
                  data-testid="select-candidate-job"
                  value={appliedJobId}
                  onChange={(e) => {
                    setAppliedJobId(e.target.value);
                    if (errors.appliedJobId) {
                      setErrors((prev) => ({ ...prev, appliedJobId: '' }));
                    }
                  }}
                  className={`mt-1 block w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-hidden dark:bg-gray-800 dark:text-white ${
                    errors.appliedJobId
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700'
                  }`}
                >
                  <option value="">-- Chọn vị trí ứng tuyển --</option>
                  {activeJobOptions.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} {job.departmentName ? `(${job.departmentName})` : ''}
                    </option>
                  ))}
                </select>
                {errors.appliedJobId && (
                  <p
                    data-testid="error-candidate-job"
                    className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.appliedJobId}</span>
                  </p>
                )}
              </div>

              {/* Nguồn ứng viên */}
              <div>
                <label
                  htmlFor="candidate-source"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Nguồn ứng viên <span className="text-rose-500">*</span>
                </label>
                <select
                  id="candidate-source"
                  data-testid="select-candidate-source"
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    if (errors.source) {
                      setErrors((prev) => ({ ...prev, source: '' }));
                    }
                  }}
                  className={`mt-1 block w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-hidden dark:bg-gray-800 dark:text-white ${
                    errors.source
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700'
                  }`}
                >
                  {CANDIDATE_SOURCE_CONFIG.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {errors.source && (
                  <p
                    data-testid="error-candidate-source"
                    className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.source}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Kỹ năng & Kinh nghiệm */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
              <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                3. Kỹ năng chuyên môn & Kinh nghiệm
              </h3>
            </div>

            <div className="space-y-4">
              {/* Thẻ kỹ năng chính */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Thẻ kỹ năng chuyên môn (Skill Tags)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      data-testid="input-skill-tag"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="Nhập kỹ năng rồi nhấn Enter hoặc bấm Thêm..."
                      className="block w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    data-testid="btn-add-skill"
                    onClick={() => handleAddSkill()}
                    className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm
                  </button>
                </div>

                {/* Danh sách kỹ năng đã chọn */}
                <div className="mt-2.5 flex flex-wrap gap-1.5" data-testid="selected-skills-container">
                  {skills.length === 0 ? (
                    <span className="text-xs italic text-gray-400">Chưa gắn thẻ kỹ năng nào.</span>
                  ) : (
                    skills.map((skill) => (
                      <span
                        key={skill}
                        data-testid={`skill-badge-${skill}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          aria-label={`Xóa kỹ năng ${skill}`}
                          className="rounded-full hover:bg-blue-200 hover:text-blue-900 dark:hover:bg-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Gợi ý kỹ năng nhanh */}
                <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Gợi ý nhanh:</span>
                  {DEFAULT_POPULAR_SKILLS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      disabled={skills.includes(item)}
                      onClick={() => handleAddSkill(item)}
                      className={`rounded-md px-1.5 py-0.5 transition-colors ${
                        skills.includes(item)
                          ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                          : 'bg-gray-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:hover:bg-blue-900/40'
                      }`}
                    >
                      {`+${item}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Số năm kinh nghiệm */}
                <div>
                  <label
                    htmlFor="candidate-experience"
                    className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Số năm kinh nghiệm
                  </label>
                  <input
                    id="candidate-experience"
                    data-testid="input-candidate-experience"
                    type="number"
                    min="0"
                    max="40"
                    step="0.5"
                    value={experienceYears}
                    onChange={(e) => {
                      setExperienceYears(e.target.value);
                      if (errors.experienceYears) {
                        setErrors((prev) => ({ ...prev, experienceYears: '' }));
                      }
                    }}
                    placeholder="Ví dụ: 3.5"
                    className={`mt-1 block w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-hidden dark:bg-gray-800 dark:text-white ${
                      errors.experienceYears
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700'
                    }`}
                  />
                  {errors.experienceYears && (
                    <p
                      data-testid="error-candidate-experience"
                      className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.experienceYears}</span>
                    </p>
                  )}
                </div>

                {/* Đơn vị công tác gần nhất */}
                <div>
                  <label
                    htmlFor="candidate-company"
                    className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Đơn vị công tác gần nhất
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <input
                      id="candidate-company"
                      data-testid="input-candidate-company"
                      type="text"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="Ví dụ: FPT Software, VNPAY, Viettel..."
                      className="block w-full rounded-xl border border-gray-300 pl-9 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Ghi chú hồ sơ */}
              <div>
                <label
                  htmlFor="candidate-notes"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Ghi chú hồ sơ / Giới thiệu sơ lược
                </label>
                <textarea
                  id="candidate-notes"
                  data-testid="textarea-candidate-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm về nguồn giới thiệu, điểm mạnh nổi bật hoặc thỏa thuận ban đầu..."
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Khu vực tải lên tệp CV (Resume/CV Upload Area) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  4. Đính kèm tệp hồ sơ / CV ứng viên
                </h3>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Hỗ trợ PDF, DOC, DOCX (tối đa 10MB)
              </span>
            </div>

            {/* Input file ẩn */}
            <input
              ref={fileInputRef}
              type="file"
              data-testid="file-cv-input"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleValidateAndSetFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {!cvFile ? (
              /* Dropzone khi chưa có file */
              <div
                data-testid="cv-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-950/40'
                    : 'border-gray-300 bg-gray-50/60 hover:bg-gray-100/70 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:bg-gray-800/80'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 mb-3">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  <span className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    Bấm để duyệt tệp
                  </span>{' '}
                  hoặc kéo và thả tệp CV vào đây
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Định dạng hợp lệ: PDF, DOC, DOCX &bull; Kích thước tối đa: 10MB
                </p>
              </div>
            ) : (
              /* Thẻ hiển thị khi đã chọn file */
              <div
                data-testid="uploaded-cv-card"
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p
                      data-testid="cv-filename"
                      className="truncate text-sm font-semibold text-gray-900 dark:text-white"
                      title={cvFile.name}
                    >
                      {cvFile.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span data-testid="cv-filesize">{formatFileSize(cvFile.size)}</span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Đã tải lên
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  {/* Nút Xem trước */}
                  <button
                    type="button"
                    data-testid="btn-preview-cv"
                    onClick={() => {
                      if (cvFilePreviewUrl) {
                        setIsPreviewOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Xem trước
                  </button>

                  {/* Nút Tự động điền form từ CV (AI Suggestion) */}
                  <button
                    type="button"
                    data-testid="btn-autofill-cv"
                    disabled={isParsingCv}
                    onClick={handleAutoFillFromCv}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                    title="Tự động trích xuất thông tin cơ bản từ CV điền vào form"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isParsingCv ? 'animate-spin' : ''}`} />
                    {isParsingCv ? 'Đang trích xuất...' : 'Tự động điền'}
                  </button>

                  {/* Nút Xóa file */}
                  <button
                    type="button"
                    data-testid="btn-remove-cv"
                    onClick={handleRemoveFile}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 shadow-2xs hover:bg-rose-50 dark:border-rose-900 dark:bg-gray-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa tệp
                  </button>
                </div>
              </div>
            )}

            {/* Thông báo lỗi tải file */}
            {fileError && (
              <p
                data-testid="error-cv-file"
                className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{fileError}</span>
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-850/60 rounded-b-2xl">
          <button
            type="button"
            data-testid="btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 focus:outline-hidden disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750"
          >
            Hủy bỏ
          </button>

          <div className="flex w-full sm:w-auto items-center gap-2.5">
            {/* Nút Lưu và tiếp tục thêm */}
            <button
              type="button"
              data-testid="btn-save-and-continue"
              onClick={() => handleSubmit('continue')}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-100 focus:outline-hidden disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
            >
              {isSubmitting && submitAction === 'continue' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Lưu và tiếp tục thêm</span>
                </>
              )}
            </button>

            {/* Nút Lưu và đóng form */}
            <button
              type="button"
              data-testid="btn-save-and-close"
              onClick={() => handleSubmit('close')}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-hidden disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSubmitting && submitAction === 'close' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Lưu và đóng form</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Preview CV File nếu đang xem */}
      {isPreviewOpen && cvFilePreviewUrl && (
        <div
          data-testid="cv-preview-modal"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  Xem trước: {cvFile?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={cvFilePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Mở tab mới
                </a>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-2">
              <iframe
                src={cvFilePreviewUrl}
                title="CV Preview"
                className="h-full w-full rounded-lg border border-gray-200 dark:border-gray-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualCandidateCreateModal;
