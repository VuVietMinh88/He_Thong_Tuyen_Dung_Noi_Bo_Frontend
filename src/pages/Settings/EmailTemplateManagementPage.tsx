import React, { useState, useMemo, useRef, useId, useEffect } from 'react';
import {
  Mail,
  Save,
  RotateCcw,
  Sparkles,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Copy,
  Check,
  UserCheck,
  Send,
  Sliders,
  Layers,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '../../components/notifications/useToast';
import emailTemplateService from '../../services/emailTemplateService';
import {
  type EmailTemplateItem,
  type EmailTemplateStage,
  type EmailVariable,
  type EmailVariableCategory,
  DEFAULT_EMAIL_TEMPLATES,
  AVAILABLE_EMAIL_VARIABLES,
  SAMPLE_CANDIDATES,
  renderEmailTemplateWithData,
  getStoredEmailTemplates,
  saveStoredEmailTemplates,
} from '../../types/emailTemplate';

const STAGE_FILTERS: Array<{ id: EmailTemplateStage | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'Tất cả giai đoạn' },
  { id: 'NEW', label: 'Hồ sơ mới' },
  { id: 'INTERVIEWING', label: 'Phỏng vấn' },
  { id: 'OFFER', label: 'Đề xuất việc (Offer)' },
  { id: 'REJECTED', label: 'Từ chối' },
];

const VARIABLE_CATEGORIES: Array<{ id: EmailVariableCategory | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'Tất cả biến' },
  { id: 'CANDIDATE', label: 'Ứng viên' },
  { id: 'JOB', label: 'Vị trí & Công ty' },
  { id: 'INTERVIEW', label: 'Phỏng vấn' },
  { id: 'OFFER', label: 'Đãi ngộ & Offer' },
  { id: 'SENDER', label: 'Người phụ trách' },
];

/**
 * Màn hình Quản lý mẫu email tuyển dụng theo giai đoạn
 * Jira Task: TKNHTTDNB1-529 / TKNHTTDNB1-77 (User Story S8-01)
 */
export const EmailTemplateManagementPage: React.FC = () => {
  const { addToast } = useToast();
  const searchInputId = useId();
  const templateNameInputId = useId();
  const templateSubjectInputId = useId();
  const templateBodyTextareaId = useId();
  const sampleCandidateSelectId = useId();

  // Danh sách các mẫu email (khởi tạo từ LocalStorage hoặc mặc định)
  const [templates, setTemplates] = useState<EmailTemplateItem[]>(() =>
    getStoredEmailTemplates(),
  );

  // Mẫu email đang được chọn để chỉnh sửa & xem trước (AC 1)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    () => templates[0]?.id || DEFAULT_EMAIL_TEMPLATES[0].id,
  );

  // Bộ lọc giai đoạn và từ khóa tìm kiếm (AC 1)
  const [selectedStageFilter, setSelectedStageFilter] = useState<EmailTemplateStage | 'ALL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Ứng viên mẫu đang chọn để Live Preview (AC 2)
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_CANDIDATES[0].id);

  // Nhóm biến động đang chọn trong toolbar (AC 2)
  const [selectedVarCategory, setSelectedVarCategory] = useState<EmailVariableCategory | 'ALL'>('ALL');

  // Tab hiển thị trên mobile: Soạn thảo hoặc Xem trước (AC 2)
  const [activeMobileTab, setActiveMobileTab] = useState<'EDITOR' | 'PREVIEW'>('EDITOR');

  // Trạng thái theo dõi thay đổi chưa lưu & loading
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Hiệu ứng copy biến
  const [copiedVarKey, setCopiedVarKey] = useState<string | null>(null);

  // Theo dõi input nào đang focus để chèn biến vào vị trí con trỏ (AC 2)
  const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'body'>('body');
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Mẫu thư hiện tại đang chỉnh sửa
  const currentTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  // Ứng viên mẫu hiện tại dùng cho Live Preview
  const currentSampleCandidate = useMemo(() => {
    return (
      SAMPLE_CANDIDATES.find((c) => c.id === selectedSampleId) || SAMPLE_CANDIDATES[0]
    );
  }, [selectedSampleId]);

  // Dữ liệu nội dung xem trước thời gian thực (Live Preview - AC 2)
  const [previewData, setPreviewData] = useState<{
    renderedSubject: string;
    renderedBody: string;
  }>(() => ({
    renderedSubject: currentTemplate ? renderEmailTemplateWithData(currentTemplate.subject, currentSampleCandidate) : '',
    renderedBody: currentTemplate ? renderEmailTemplateWithData(currentTemplate.body, currentSampleCandidate) : '',
  }));

  // 1. Tải danh sách mẫu email từ API Backend (AC 1)
  useEffect(() => {
    let isMounted = true;
    const fetchTemplates = async () => {
      try {
        const data = await emailTemplateService.getEmailTemplates();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setTemplates(data);
          setSelectedTemplateId((curr) =>
            data.some((t) => t.id === curr) ? curr : data[0].id,
          );
        }
      } catch (err: unknown) {
        if (isMounted) {
          addToast({
            type: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'Không thể tải danh sách mẫu email từ máy chủ. Đang sử dụng dữ liệu cục bộ.',
          });
        }
      }
    };

    fetchTemplates();
    return () => {
      isMounted = false;
    };
  }, [addToast]);

  // 2. Cập nhật xem trước thời gian thực qua service khi thay đổi mẫu/nội dung/ứng viên (AC 2)
  useEffect(() => {
    let isCurrent = true;
    const fetchPreview = async () => {
      setIsPreviewLoading(true);
      try {
        const res = await emailTemplateService.previewEmailTemplate({
          templateId: currentTemplate.id,
          subject: currentTemplate.subject,
          body: currentTemplate.body,
          sampleCandidateId: selectedSampleId,
          sampleData: currentSampleCandidate,
        });

        if (isCurrent) {
          setPreviewData({
            renderedSubject: res.renderedSubject,
            renderedBody: res.renderedBody,
          });
        }
      } catch {
        if (isCurrent) {
          setPreviewData({
            renderedSubject: renderEmailTemplateWithData(currentTemplate.subject, currentSampleCandidate),
            renderedBody: renderEmailTemplateWithData(currentTemplate.body, currentSampleCandidate),
          });
        }
      } finally {
        if (isCurrent) {
          setIsPreviewLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchPreview, 120);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [currentTemplate.id, currentTemplate.subject, currentTemplate.body, selectedSampleId, currentSampleCandidate]);

  // Lọc danh sách mẫu thư theo giai đoạn và từ khóa
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (selectedStageFilter !== 'ALL' && tpl.stage !== selectedStageFilter) {
        return false;
      }
      if (searchKeyword.trim()) {
        const lower = searchKeyword.toLowerCase().trim();
        const matchName = tpl.name.toLowerCase().includes(lower);
        const matchSubject = tpl.subject.toLowerCase().includes(lower);
        const matchDesc = tpl.description.toLowerCase().includes(lower);
        if (!matchName && !matchSubject && !matchDesc) return false;
      }
      return true;
    });
  }, [templates, selectedStageFilter, searchKeyword]);

  // Lọc danh sách biến động theo danh mục
  const filteredVariables = useMemo(() => {
    if (selectedVarCategory === 'ALL') return AVAILABLE_EMAIL_VARIABLES;
    return AVAILABLE_EMAIL_VARIABLES.filter((v) => v.category === selectedVarCategory);
  }, [selectedVarCategory]);

  // Thống kê nhanh số lượng mẫu thư tự động gửi (AC 3)
  const stats = useMemo(() => {
    const total = templates.length;
    const autoCount = templates.filter((t) => t.isAutoSend).length;
    const manualCount = total - autoCount;
    return { total, autoCount, manualCount };
  }, [templates]);

  // Chỉnh sửa tiêu đề email
  const handleSubjectChange = (val: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === currentTemplate.id ? { ...t, subject: val } : t)),
    );
    setHasUnsavedChanges(true);
  };

  // Chỉnh sửa nội dung email
  const handleBodyChange = (val: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === currentTemplate.id ? { ...t, body: val } : t)),
    );
    setHasUnsavedChanges(true);
  };

  // Chỉnh sửa tên mẫu thư
  const handleNameChange = (val: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === currentTemplate.id ? { ...t, name: val } : t)),
    );
    setHasUnsavedChanges(true);
  };

  // 3. Bật / Tắt tính năng gửi tự động cho từng mẫu thư và đồng bộ lên server (AC 2 & AC 3)
  const handleToggleAutoSend = async (templateId: string) => {
    const target = templates.find((t) => t.id === templateId);
    if (!target) return;
    const nextState = !target.isAutoSend;

    // Cập nhật giao diện tức thời (Optimistic UI)
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, isAutoSend: nextState } : t)),
    );
    setHasUnsavedChanges(true);

    try {
      await emailTemplateService.updateTemplateAutoSend(templateId, nextState);
      addToast({
        type: nextState ? 'success' : 'info',
        message: nextState
          ? `Đã kích hoạt gửi tự động cho mẫu "${target.name}". Hệ thống sẽ tự động gửi khi ứng viên vào giai đoạn tương ứng.`
          : `Đã chuyển mẫu "${target.name}" sang chế độ gửi thủ công (cần nhân viên nhân sự duyệt trước).`,
      });
    } catch (err: unknown) {
      // Hoàn tác nếu gặp lỗi
      setTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, isAutoSend: !nextState } : t)),
      );
      addToast({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể cập nhật cấu hình gửi tự động. Vui lòng thử lại.',
      });
    }
  };

  // 4. Chèn biến động vào vị trí con trỏ (AC 2)
  const handleInsertVariable = (variable: EmailVariable) => {
    if (lastFocusedField === 'subject' && subjectInputRef.current) {
      const input = subjectInputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const oldVal = currentTemplate.subject;
      const newVal = oldVal.slice(0, start) + variable.key + oldVal.slice(end);

      handleSubjectChange(newVal);

      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.key.length, start + variable.key.length);
      }, 0);
    } else {
      const textarea = bodyTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const oldVal = currentTemplate.body;
        const newVal = oldVal.slice(0, start) + variable.key + oldVal.slice(end);

        handleBodyChange(newVal);

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + variable.key.length, start + variable.key.length);
        }, 0);
      } else {
        handleBodyChange(currentTemplate.body + ' ' + variable.key);
      }
    }

    setCopiedVarKey(variable.key);
    setTimeout(() => setCopiedVarKey(null), 1500);

    addToast({
      type: 'success',
      message: `Đã chèn biến ${variable.key} vào ${lastFocusedField === 'subject' ? 'tiêu đề' : 'nội dung'}`,
    });
  };

  // 5. Lưu toàn bộ cấu hình mẫu email vào hệ thống qua API Service (AC 1 & AC 3)
  const handleSaveTemplates = async () => {
    setIsSaving(true);
    try {
      // Gửi request cập nhật mẫu đang chọn lên Backend API
      await emailTemplateService.updateEmailTemplate(currentTemplate.id, {
        name: currentTemplate.name,
        subject: currentTemplate.subject,
        body: currentTemplate.body,
        isAutoSend: currentTemplate.isAutoSend,
        isAutoSendEnabled: currentTemplate.isAutoSend,
      });

      // Lưu đồng bộ vào LocalStorage
      saveStoredEmailTemplates(templates);
      setHasUnsavedChanges(false);

      addToast({
        type: 'success',
        message: `Đã lưu thành công cấu hình mẫu email "${currentTemplate.name}".`,
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể lưu cấu hình mẫu email. Vui lòng thử lại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Khôi phục lại mẫu mặc định qua API Service
  const handleConfirmReset = async () => {
    try {
      const defaults = await emailTemplateService.resetEmailTemplates();
      setTemplates(defaults);
      setSelectedTemplateId(defaults[0].id);
      setHasUnsavedChanges(false);
      setIsResetModalOpen(false);

      addToast({
        type: 'info',
        message: 'Đã khôi phục toàn bộ mẫu email về thiết lập mặc định của hệ thống.',
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể khôi phục thiết lập mặc định. Vui lòng thử lại.',
      });
    }
  };

  // 7. Nội dung xem trước thời gian thực (Live Preview - AC 2)
  const renderedSubjectPreview = previewData.renderedSubject;
  const renderedBodyPreview = previewData.renderedBody;

  return (
    <div
      data-testid="email-template-management-page"
      className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6"
    >
      {/* 1. Header Bar của trang */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Quản lý mẫu email tuyển dụng
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Cấu hình mẫu email tự động theo từng giai đoạn, chèn biến động và xem trước với dữ liệu thật
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động Lưu & Khôi phục */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shadow-2xs"
            title="Khôi phục lại 5 mẫu email chuẩn ban đầu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Khôi phục mặc định</span>
          </button>

          <button
            type="button"
            onClick={handleSaveTemplates}
            disabled={isSaving || !hasUnsavedChanges}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Đang lưu cấu hình...' : 'Lưu thay đổi'}</span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Thống kê tóm tắt & Cảnh báo trạng thái */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-500">Tổng số mẫu email</span>
            <div className="text-2xl font-black text-slate-800">{stats.total}</div>
            <p className="text-[11px] text-slate-400">Phục vụ 5 giai đoạn chính</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-emerald-800">Đang bật gửi tự động</span>
            <div className="text-2xl font-black text-emerald-700">{stats.autoCount}</div>
            <p className="text-[11px] text-emerald-600">Tự động kích hoạt khi vào giai đoạn</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-amber-900">Chế độ gửi thủ công</span>
            <div className="text-2xl font-black text-amber-800">{stats.manualCount}</div>
            <p className="text-[11px] text-amber-700">Cần nhân viên nhân sự duyệt trước</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <Sliders className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Bố cục chính 2 Cột: Danh sách mẫu thư bên trái & Trình soạn thảo/Xem trước bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* CỘT TRÁI: DANH SÁCH CÁC MẪU EMAIL THEO GIAI ĐOẠN (AC 1 & AC 3)             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Mẫu email theo giai đoạn
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">
              {`${filteredTemplates.length} mẫu`}
            </span>
          </div>

          {/* Ô tìm kiếm nhanh */}
          <div className="relative">
            <label htmlFor={searchInputId} className="sr-only">
              Tìm kiếm mẫu email
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              id={searchInputId}
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo tên mẫu, tiêu đề..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
            />
          </div>

          {/* Bộ lọc giai đoạn (Stage Filter Pills) */}
          <div className="flex flex-wrap gap-1.5">
            {STAGE_FILTERS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStageFilter(st.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                  selectedStageFilter === st.id
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Danh sách các Cards Mẫu Email */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredTemplates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Không tìm thấy mẫu email phù hợp với bộ lọc.
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const isSelected = tpl.id === currentTemplate.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              tpl.stage === 'NEW'
                                ? 'bg-blue-100 text-blue-800'
                                : tpl.stage === 'INTERVIEWING'
                                ? 'bg-purple-100 text-purple-800'
                                : tpl.stage === 'OFFER'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tpl.stage === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {tpl.stageLabel}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                          {tpl.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>

                    {/* Dòng điều khiển Công tắc Bật/Tắt Gửi Tự Động (AC 3) */}
                    <div
                      className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                        {tpl.isAutoSend ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Tự động gửi
                          </span>
                        ) : (
                          <span className="text-slate-500">Gửi thủ công</span>
                        )}
                      </span>

                      {/* Công tắc Toggle Switch trực quan */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.isAutoSend}
                          onChange={() => handleToggleAutoSend(tpl.id)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600" />
                      </label>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT PHẢI: TRÌNH SOẠN THẢO VÀ XEM TRƯỚC (LIVE PREVIEW) (AC 2)               */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          {/* Header trình chỉnh sửa */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-300" />
                <h2 className="text-sm sm:text-base font-bold truncate">
                  {currentTemplate.name}
                </h2>
              </div>
              <p className="text-xs text-slate-300 truncate">
                {currentTemplate.description}
              </p>
            </div>

            {/* Switch Toggle ngay trong Header (AC 3) */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <span className="text-xs text-white font-medium">Gửi tự động:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentTemplate.isAutoSend}
                  onChange={() => handleToggleAutoSend(currentTemplate.id)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>

          {/* Switch Tab trên mobile (< md) giữa Soạn thảo và Xem trước */}
          <div className="flex md:hidden border-b border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setActiveMobileTab('EDITOR')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
                activeMobileTab === 'EDITOR'
                  ? 'border-rose-600 text-rose-600 bg-white'
                  : 'border-transparent text-slate-500'
              }`}
            >
              1. Soạn thảo & Chèn biến
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileTab('PREVIEW')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
                activeMobileTab === 'PREVIEW'
                  ? 'border-rose-600 text-rose-600 bg-white'
                  : 'border-transparent text-slate-500'
              }`}
            >
              2. Xem trước dữ liệu thật (Live Preview)
            </button>
          </div>

          {/* Nội dung chia 2 phần hoặc Tab mobile */}
          <div className="p-4 sm:p-5 space-y-5">
            {/* 1. KHU VỰC SOẠN THẢO VÀ CHÈN BIẾN (EDITOR - AC 2) */}
            <div className={`space-y-4 ${activeMobileTab === 'PREVIEW' ? 'hidden md:block' : 'block'}`}>
              {/* Tên mẫu email */}
              <div className="space-y-1">
                <label
                  htmlFor={templateNameInputId}
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>Tên định danh mẫu email</span>
                  <span className="text-[10px] text-slate-400 font-normal">Hiển thị trong nội bộ</span>
                </label>
                <input
                  id={templateNameInputId}
                  type="text"
                  value={currentTemplate.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200 font-medium"
                />
              </div>

              {/* Tiêu đề Email */}
              <div className="space-y-1">
                <label
                  htmlFor={templateSubjectInputId}
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>Tiêu đề email (Subject) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Hỗ trợ chèn biến động</span>
                </label>
                <input
                  id={templateSubjectInputId}
                  ref={subjectInputRef}
                  type="text"
                  value={currentTemplate.subject}
                  onFocus={() => setLastFocusedField('subject')}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  placeholder="Nhập tiêu đề thư gửi tới ứng viên..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200 font-medium"
                />
              </div>

              {/* THANH CÔNG CỤ CHÈN BIẾN ĐỘNG (DYNAMIC VARIABLES TOOLBAR - AC 2) */}
              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Thanh công cụ chèn biến động (Nhấp để chèn):</span>
                  </div>

                  <span className="text-[11px] text-indigo-700">
                    Đang chèn vào: <strong>{lastFocusedField === 'subject' ? 'Tiêu đề' : 'Nội dung'}</strong>
                  </span>
                </div>

                {/* Nhóm danh mục biến */}
                <div className="flex flex-wrap gap-1">
                  {VARIABLE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedVarCategory(cat.id)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition cursor-pointer ${
                        selectedVarCategory === cat.id
                          ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                          : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-100/70'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Danh sách các chip biến có thể click chèn */}
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 pt-1">
                  {filteredVariables.map((variable) => (
                    <button
                      key={variable.key}
                      type="button"
                      onClick={() => handleInsertVariable(variable)}
                      className="group inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all cursor-pointer shadow-2xs"
                      title={`${variable.name} (Ví dụ: ${variable.exampleValue})`}
                    >
                      <span>{variable.key}</span>
                      {copiedVarKey === variable.key ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-indigo-400 group-hover:text-white opacity-60" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] text-indigo-800 flex items-center gap-1 pt-0.5">
                  <HelpCircle className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>
                    Mẹo: Đặt con trỏ vào ô Tiêu đề hoặc Nội dung bên dưới, sau đó nhấp vào thẻ biến để chèn tự động.
                  </span>
                </div>
              </div>

              {/* Nội dung Email (Body Textarea) */}
              <div className="space-y-1">
                <label
                  htmlFor={templateBodyTextareaId}
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>Nội dung email (Body) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Hỗ trợ đầy đủ định dạng văn bản & biến động</span>
                </label>
                <textarea
                  id={templateBodyTextareaId}
                  ref={bodyTextareaRef}
                  value={currentTemplate.body}
                  onFocus={() => setLastFocusedField('body')}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  rows={10}
                  placeholder="Nhập nội dung thư tuyển dụng..."
                  className="w-full p-3.5 text-xs rounded-2xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200 leading-relaxed font-sans resize-y"
                />
              </div>
            </div>

            {/* 2. KHU VỰC XEM TRƯỚC VỚI DỮ LIỆU THẬT (LIVE PREVIEW - AC 2) */}
            <div className={`space-y-3 pt-4 border-t border-slate-200 ${activeMobileTab === 'EDITOR' ? 'hidden md:block' : 'block'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Xem trước bản nháp với dữ liệu thật (Live Preview)
                  </h3>
                </div>

                {/* Chọn ứng viên mẫu để xem trước */}
                <div className="flex items-center gap-2 text-xs">
                  <label htmlFor={sampleCandidateSelectId} className="text-slate-600 font-medium whitespace-nowrap flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dữ liệu mẫu:</span>
                  </label>
                  <select
                    id={sampleCandidateSelectId}
                    value={selectedSampleId}
                    onChange={(e) => setSelectedSampleId(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium outline-none focus:border-rose-500"
                  >
                    {SAMPLE_CANDIDATES.map((cand) => (
                      <option key={cand.id} value={cand.id}>
                        {`${cand.candidateName} - ${cand.jobTitle}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email Mock Preview Card */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Header thanh email */}
                <div className="p-3.5 bg-slate-100/80 border-b border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>
                      Người gửi:{' '}
                      <strong className="text-slate-800">
                        {currentSampleCandidate.recruiterName}
                      </strong>{' '}
                      &lt;{currentSampleCandidate.recruiterEmail}&gt;
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[10px]">
                      {isPreviewLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                          <span>Đang cập nhật bản nháp...</span>
                        </>
                      ) : (
                        <span>Xem trước thực tế</span>
                      )}
                    </span>
                  </div>

                  <div className="text-slate-700 text-xs">
                    Người nhận:{' '}
                    <strong className="text-slate-900">
                      {currentSampleCandidate.candidateName}
                    </strong>{' '}
                    &lt;{currentSampleCandidate.candidateEmail}&gt;
                  </div>

                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] font-bold text-slate-600 block">Tiêu đề email:</span>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 select-text">
                      {renderedSubjectPreview}
                    </div>
                  </div>
                </div>

                {/* Nội dung email đã thay thế biến động */}
                <div className="p-5 font-sans text-xs text-slate-800 leading-relaxed space-y-3 whitespace-pre-wrap select-text bg-white min-h-[160px]">
                  {renderedBodyPreview}
                </div>

                {/* Chân trang email giả lập */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hệ thống Tuyển Dụng Thông Minh • Mẫu thư tự động hóa chuẩn mực</span>
                  </div>
                  <span className="text-rose-600 font-semibold">Dữ liệu cá nhân hóa 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN KHÔI PHỤC MẪU MẶC ĐỊNH */}
      {isResetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận khôi phục mặc định?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thao tác này sẽ ghi đè toàn bộ 5 mẫu email hiện tại về nội dung gốc của hệ thống.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Mọi chỉnh sửa của bạn về tiêu đề, nội dung và trạng thái tự động gửi sẽ bị hủy bỏ. Bạn có chắc chắn muốn tiếp tục không?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateManagementPage;
