import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Mail,
  Sliders,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import type { CandidateStage } from '../../types/candidate';
import { CANDIDATE_STAGE_CONFIG } from '../../types/candidate';
import type { SlaSettings } from '../../types/sla';
import { DEFAULT_SLA_SETTINGS } from '../../types/sla';
import { slaService, SlaValidationError, SlaApiError } from '../../services/slaService';
import { useToast } from '../../components/notifications/useToast';

const CONFIGURABLE_STAGES: CandidateStage[] = [
  'NEW',
  'SCREENING',
  'INTERVIEWING',
  'OFFER',
  'HIRED',
];

export const SlaSettingsPage: React.FC = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<SlaSettings>(DEFAULT_SLA_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Tải cấu hình SLA từ API / LocalStorage
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await slaService.getSlaSettings();
      setSettings(data);
    } catch {
      addToast({
        type: 'error',
        message: 'Không thể tải cấu hình SLA từ máy chủ. Đang dùng cấu hình mặc định.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Xử lý thay đổi số ngày tối đa cho từng giai đoạn
  const handleStageMaxDaysChange = (stage: CandidateStage, value: number) => {
    setSettings((prev) => ({
      ...prev,
      stages: {
        ...prev.stages,
        [stage]: {
          ...prev.stages[stage],
          maxDays: value,
        },
      },
    }));
    // Xóa lỗi validation khi người dùng chỉnh sửa trường này
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[stage];
      return next;
    });
  };

  // Xử lý thay đổi số ngày cảnh báo trước
  const handleStageWarningDaysChange = (stage: CandidateStage, value: number) => {
    setSettings((prev) => ({
      ...prev,
      stages: {
        ...prev.stages,
        [stage]: {
          ...prev.stages[stage],
          warningDaysBefore: value,
        },
      },
    }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[`${stage}_warning`];
      return next;
    });
  };

  // Xử lý bật/tắt SLA cho từng giai đoạn
  const handleToggleStageEnabled = (stage: CandidateStage) => {
    setSettings((prev) => ({
      ...prev,
      stages: {
        ...prev.stages,
        [stage]: {
          ...prev.stages[stage],
          isEnabled: !prev.stages[stage]?.isEnabled,
        },
      },
    }));
  };

  // Xử lý chuyển đổi kênh nhận thông báo nhắc việc
  const handleToggleChannel = (channel: 'IN_APP' | 'EMAIL') => {
    setSettings((prev) => {
      const current = prev.notificationChannels || [];
      const updated = current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel];
      return {
        ...prev,
        notificationChannels: updated.length > 0 ? updated : ['IN_APP'],
      };
    });
  };

  // Lưu cấu hình (AC 1, AC 2)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setValidationErrors({});
      const updated = await slaService.saveSlaSettings(settings);
      setSettings(updated);
      addToast({
        type: 'success',
        message: 'Lưu cấu hình ngưỡng SLA và lịch nhắc việc thành công!',
      });
    } catch (err: unknown) {
      // Giữ nguyên trạng thái form settings để người dùng chỉnh sửa (AC 2)
      if (err instanceof SlaValidationError) {
        setValidationErrors(err.fieldErrors);
        addToast({
          type: 'warning',
          message: err.message,
        });
      } else if (err instanceof SlaApiError) {
        addToast({
          type: 'error',
          message: err.message,
        });
      } else {
        addToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Lỗi khi lưu cấu hình SLA lên hệ thống.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Đặt lại cấu hình mặc định
  const handleResetToDefault = async () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ cấu hình SLA về mặc định ban đầu?')) {
      try {
        setIsSaving(true);
        const resetData = await slaService.resetSlaSettingsToDefault();
        setSettings(resetData);
        setValidationErrors({});
        addToast({
          type: 'info',
          message: 'Đã khôi phục cấu hình SLA về mặc định thành công!',
        });
      } catch {
        addToast({
          type: 'error',
          message: 'Không thể đặt lại cấu hình mặc định.',
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Tính tổng số ngày quy trình chuẩn (từ Hồ sơ mới -> Nhận việc)
  const totalPipelineDays = CONFIGURABLE_STAGES.reduce((sum, stage) => {
    const cfg = settings.stages[stage];
    return cfg && cfg.isEnabled ? sum + cfg.maxDays : sum;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Clock className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Đang tải thông số cấu hình SLA hệ thống...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Tiêu đề trang & Thanh thao tác */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="w-6 h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Cấu hình Ngưỡng SLA Tuyển dụng
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Thiết lập thời gian xử lý tối đa cho từng giai đoạn trong Pipeline và cài đặt thông báo nhắc việc định kỳ hằng ngày khi hồ sơ quá hạn.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition shadow-2xs disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Mặc định
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </div>

      {/* Tóm tắt nhanh Pipeline SLA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Tổng thời gian toàn quy trình</span>
            <strong className="text-lg font-bold text-gray-900">
              {totalPipelineDays} ngày
            </strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Giai đoạn áp dụng SLA</span>
            <strong className="text-lg font-bold text-gray-900">
              {CONFIGURABLE_STAGES.filter((s) => settings.stages[s]?.isEnabled).length} / {CONFIGURABLE_STAGES.length} bước
            </strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Tác vụ quét định kỳ</span>
            <strong className="text-lg font-bold text-gray-900">
              {settings.enableDailyReminder ? `${settings.reminderTime} hằng ngày` : 'Đang tắt'}
            </strong>
          </div>
        </div>
      </div>

      {/* Cấu hình tổng thể & Bật/Tắt Toàn cục */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Kích hoạt Cơ chế Quản trị SLA Toàn hệ thống
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Bật tính năng này để tự động tính thời gian tồn đọng hồ sơ và gắn cờ cảnh báo quá hạn trên danh sách và Pipeline.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.isGlobalSlaEnabled}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, isGlobalSlaEnabled: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {/* Bảng cấu hình ngưỡng chi tiết cho từng giai đoạn (AC 1) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Ngưỡng SLA cho từng giai đoạn Pipeline
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Hồ sơ nằm ở giai đoạn quá số ngày quy định sẽ được gắn cờ báo động đỏ và gửi nhắc việc cho Recruiter phụ trách.
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {CONFIGURABLE_STAGES.map((stage) => {
            const stageConfig = settings.stages[stage] || {
              stage,
              stageName: CANDIDATE_STAGE_CONFIG[stage]?.label || stage,
              maxDays: 3,
              warningDaysBefore: 1,
              isEnabled: true,
              description: '',
            };
            const meta = CANDIDATE_STAGE_CONFIG[stage];
            const error = validationErrors[stage];
            const warningError = validationErrors[`${stage}_warning`];

            return (
              <div
                key={stage}
                className={`p-4 sm:p-5 transition-colors ${
                  !stageConfig.isEnabled ? 'bg-gray-50/50 opacity-60' : 'hover:bg-gray-50/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Cột 1: Thông tin giai đoạn */}
                  <div className="flex items-start gap-3 min-w-[260px] flex-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 mt-0.5 ${meta?.badgeClass}`}
                    >
                      {meta?.label}
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-800">
                        {stageConfig.description || meta?.description}
                      </p>
                      <span className="text-[11px] text-gray-400 block">
                        Mã giai đoạn: <code className="font-mono">{stage}</code>
                      </span>
                    </div>
                  </div>

                  {/* Cột 2: Thiết lập ngưỡng SLA & Cảnh báo */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    {/* Input Ngưỡng tối đa */}
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`max-days-${stage}`}
                        className="text-xs font-semibold text-gray-700 whitespace-nowrap"
                      >
                        Ngưỡng SLA:
                      </label>
                      <div className="relative">
                        <input
                          id={`max-days-${stage}`}
                          type="number"
                          min={1}
                          max={90}
                          value={stageConfig.maxDays}
                          disabled={!stageConfig.isEnabled || !settings.isGlobalSlaEnabled}
                          onChange={(e) =>
                            handleStageMaxDaysChange(stage, parseInt(e.target.value, 10))
                          }
                          className="w-20 px-2.5 py-1.5 text-xs sm:text-sm font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <span className="text-xs text-gray-500 ml-1.5 font-medium">ngày</span>
                      </div>
                    </div>

                    {/* Input Cảnh báo trước */}
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`warning-days-${stage}`}
                        className="text-xs font-semibold text-gray-700 whitespace-nowrap flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Báo trước:
                      </label>
                      <div className="relative">
                        <input
                          id={`warning-days-${stage}`}
                          type="number"
                          min={0}
                          max={10}
                          value={stageConfig.warningDaysBefore}
                          disabled={!stageConfig.isEnabled || !settings.isGlobalSlaEnabled}
                          onChange={(e) =>
                            handleStageWarningDaysChange(stage, parseInt(e.target.value, 10))
                          }
                          className="w-16 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <span className="text-xs text-gray-500 ml-1.5 font-medium">ngày</span>
                      </div>
                    </div>

                    {/* Switch bật/tắt riêng cho giai đoạn này */}
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                      <button
                        type="button"
                        onClick={() => handleToggleStageEnabled(stage)}
                        disabled={!settings.isGlobalSlaEnabled}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                          stageConfig.isEnabled
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {stageConfig.isEnabled ? 'Đang bật' : 'Đang tắt'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Thông báo lỗi validation */}
                {(error || warningError) && (
                  <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error || warningError}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cấu hình Nhắc việc định kỳ hằng ngày (AC 3) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-600" />
              Cơ chế Nhắc việc Định kỳ Hằng ngày (Daily Overdue Reminders)
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Hệ thống tự động quét và gửi thông báo nhắc việc cho chuyên viên tuyển dụng phụ trách khi hồ sơ quá hạn (đảm bảo không nhắc trùng trong cùng 1 ngày).
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.enableDailyReminder}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, enableDailyReminder: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Giờ quét nhắc việc hằng ngày */}
          <div className="space-y-2">
            <label
              htmlFor="reminder-time-input"
              className="block text-xs sm:text-sm font-bold text-gray-800"
            >
              Thời gian chạy tác vụ quét hằng ngày:
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                id="reminder-time-input"
                type="time"
                value={settings.reminderTime}
                disabled={!settings.enableDailyReminder}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, reminderTime: e.target.value }))
                }
                className="px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden disabled:bg-gray-100"
              />
              <span className="text-xs text-gray-500">
                (Theo múi giờ Việt Nam Asia/Ho_Chi_Minh)
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Ví dụ: lúc 09:00 sáng mỗi ngày, Recruiter đăng nhập sẽ thấy các thẻ hồ sơ quá hạn được tổng hợp sẵn tại chuông thông báo.
            </p>
          </div>

          {/* Kênh gửi nhắc việc */}
          <div className="space-y-2">
            <span className="block text-xs sm:text-sm font-bold text-gray-800">
              Kênh thông báo nhận nhắc việc:
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggleChannel('IN_APP')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition ${
                  settings.notificationChannels?.includes('IN_APP')
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                <Bell className="w-4 h-4 text-rose-600" />
                Chuông thông báo nội bộ (In-app)
              </button>

              <button
                type="button"
                onClick={() => handleToggleChannel('EMAIL')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition ${
                  settings.notificationChannels?.includes('EMAIL')
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                    : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                <Mail className="w-4 h-4 text-indigo-600" />
                Email nhắc việc
              </button>
            </div>
          </div>
        </div>

        {/* Ghi chú chính sách chống nhắc trùng */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Nguyên tắc chống nhắc trùng lặp:</strong> Mỗi hồ sơ tại cùng một giai đoạn chỉ được sinh tối đa 1 bản ghi nhắc việc trong 1 ngày làm việc (tránh tình trạng spam thông báo khiến người dùng khó chịu). Khi sang ngày mới và hồ sơ vẫn chưa được chuyển giai đoạn, hệ thống mới ghi nhận ngày quá hạn tiếp theo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SlaSettingsPage;
