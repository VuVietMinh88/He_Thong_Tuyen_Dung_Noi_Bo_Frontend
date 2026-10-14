import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Briefcase,
  Building,
  Calendar,
  ExternalLink,
  Clock,
  Send,
  RefreshCw,
} from 'lucide-react';
import type {
  CandidateProfile,
  CvSuggestedCandidateInfo,
} from '../../types/candidate';
import { CvSuggestionConfirmBox } from './CvSuggestionConfirmBox';
import { candidateService } from '../../services/candidateService';
import { toast } from '../notifications';

export interface CandidateDetailModalProps {
  isOpen: boolean;
  candidateProfile: CandidateProfile | null;
  onClose: () => void;
  onProfileUpdated?: (updatedCandidate: CandidateProfile) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  isOpen,
  candidateProfile,
  onClose,
  onProfileUpdated,
}) => {
  const [currentCandidate, setCurrentCandidate] =
    useState<CandidateProfile | null>(candidateProfile);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Đồng bộ lại hồ sơ khi prop candidateProfile thay đổi
  const [previousCandidateId, setPreviousCandidateId] = useState<string | null>(
    candidateProfile?.id || null
  );
  if (candidateProfile && previousCandidateId !== candidateProfile.id) {
    setPreviousCandidateId(candidateProfile.id);
    setCurrentCandidate(candidateProfile);
  }

  const candidateId = currentCandidate?.id;
  const candidateParsingStatus = currentCandidate?.cvParsingStatus;

  // Luồng bóc tách CV tự động độc lập khi mở hồ sơ có trạng thái PARSING
  // Tại sao: Bóc tách bất đồng bộ và lưu vào state gợi ý riêng, không làm đơ UI hồ sơ
  useEffect(() => {
    let isSubscribed = true;

    if (isOpen && candidateId && candidateParsingStatus === 'PARSING') {
      const executeCvExtraction = async () => {
        try {
          const suggestedResult = await candidateService.fetchCvParsedSuggestion(
            candidateId
          );
          if (isSubscribed) {
            // Tại sao: Kết quả bóc tách chỉ lưu vào state gợi ý cvSuggestedInfo,
            // tuyệt đối KHÔNG tự động ghi đè vào các trường họ tên, email, phone gốc của ứng viên.
            setCurrentCandidate((previousCandidate) => {
              if (!previousCandidate || previousCandidate.id !== candidateId) return previousCandidate;
              return {
                ...previousCandidate,
                cvParsingStatus: 'PENDING_CONFIRMATION',
                cvSuggestedInfo: suggestedResult,
                cvParsingErrorMessage: undefined,
              };
            });
          }
        } catch (parsingError: unknown) {
          if (isSubscribed) {
            // Tại sao: Bắt lỗi độc lập cho luồng đọc CV, không làm vỡ hoặc chặn màn hình chi tiết hồ sơ
            const extractedMessage =
              parsingError instanceof Error
                ? parsingError.message
                : 'Không thể trích xuất tự động văn bản từ tệp CV.';
            setCurrentCandidate((previousCandidate) => {
              if (!previousCandidate || previousCandidate.id !== candidateId) return previousCandidate;
              return {
                ...previousCandidate,
                cvParsingStatus: 'FAILED',
                cvParsingErrorMessage: extractedMessage,
              };
            });
          }
        }
      };

      executeCvExtraction();
    }

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, candidateId, candidateParsingStatus]);

  if (!isOpen || !currentCandidate) {
    return null;
  }

  const handleApplySuggestion = async (
    confirmedData: CvSuggestedCandidateInfo
  ): Promise<void> => {
    setIsProcessingAction(true);
    try {
      // Chỉ khi Recruiter chủ động nhấn "Xác nhận áp dụng", hệ thống mới ghi đè vào dữ liệu chính của hồ sơ
      const updatedProfile = await candidateService.applyConfirmedCandidateInfo(
        currentCandidate.id,
        confirmedData
      );
      setCurrentCandidate(updatedProfile);
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
      toast.success(
        'Đã áp dụng thành công dữ liệu gợi ý từ CV vào hồ sơ ứng viên!'
      );
    } catch (caughtError: unknown) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : 'Không thể áp dụng dữ liệu gợi ý từ CV.';
      toast.error(errorMessage);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDismissSuggestion = async (): Promise<void> => {
    setIsProcessingAction(true);
    try {
      // Bỏ qua gợi ý từ CV, giữ nguyên vẹn dữ liệu gốc ban đầu
      const updatedProfile = await candidateService.dismissCvSuggestion(
        currentCandidate.id
      );
      setCurrentCandidate(updatedProfile);
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
      toast.info('Đã bỏ qua dữ liệu gợi ý từ CV. Hồ sơ giữ nguyên thông tin gốc.');
    } catch (caughtError: unknown) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : 'Không thể bỏ qua dữ liệu gợi ý từ CV.';
      toast.error(errorMessage);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRetryParsing = async (): Promise<void> => {
    setIsProcessingAction(true);
    try {
      const updatedProfile = await candidateService.retryCvParsing(
        currentCandidate.id
      );
      setCurrentCandidate(updatedProfile);
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
      toast.info('Hệ thống đã phân tích lại tệp CV.');
    } catch (caughtError: unknown) {
      // Bắt lỗi độc lập, giữ nguyên thông tin hồ sơ
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : 'Không thể phân tích lại tệp CV.';
      setCurrentCandidate((previousCandidate) => {
        if (!previousCandidate) return null;
        return {
          ...previousCandidate,
          cvParsingStatus: 'FAILED',
          cvParsingErrorMessage: errorMessage,
        };
      });
      toast.error(errorMessage);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-detail-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs transition-opacity"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-gray-900 dark:ring-white/10">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4.5 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {currentCandidate.trackingCode || 'HỒ SƠ ỨNG VIÊN'}
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                {currentCandidate.status || 'Mới nộp'}
              </span>
            </div>
            <h2
              id="candidate-detail-modal-title"
              className="mt-1 text-xl font-bold text-gray-900 dark:text-white"
            >
              {currentCandidate.fullName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Vị trí ứng tuyển:{' '}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {currentCandidate.appliedJobTitle || 'Chưa xác định'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chi tiết ứng viên"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-gray-300 focus:outline-hidden dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nội dung chi tiết cuộn được */}
        <div className="space-y-6 overflow-y-auto p-6">
          {/* KHU VỰC XÁC NHẬN DỮ LIỆU GỢI Ý TỪ CV (SUBTASK TKNHTTDNB1-331) */}
          <div>
            <CvSuggestionConfirmBox
              candidateProfile={currentCandidate}
              onApplySuggestion={handleApplySuggestion}
              onDismissSuggestion={handleDismissSuggestion}
              onRetryParsing={handleRetryParsing}
              isProcessing={isProcessingAction}
            />
          </div>

          {/* Khối thông tin tệp CV đính kèm */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-850">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tệp CV đính kèm của ứng viên
            </h4>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentCandidate.cvFileName || 'CV_UngVien.pdf'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Định dạng PDF • Tải lên lúc{' '}
                    {currentCandidate.appliedAt
                      ? new Date(currentCandidate.appliedAt).toLocaleString('vi-VN')
                      : 'Mới đây'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="re-extract-cv-btn"
                  onClick={handleRetryParsing}
                  disabled={isProcessingAction}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isProcessingAction ? 'animate-spin' : ''}`} />
                  Trích xuất lại từ CV
                </button>

                {currentCandidate.cvUrl && (
                  <a
                    href={currentCandidate.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                    Mở tệp CV PDF
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin tuyển dụng & Thư giới thiệu */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Chi tiết tuyển dụng
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span>Vị trí:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentCandidate.appliedJobTitle || 'Chưa xác định'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>Khối / Phòng ban:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentCandidate.departmentName || 'Chưa phân bổ'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Send className="h-4 w-4 text-gray-400" />
                  <span>Kênh tiếp nhận:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentCandidate.source || 'Website công ty'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Dấu mốc thời gian
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Thời điểm nộp đơn:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentCandidate.appliedAt
                      ? new Date(currentCandidate.appliedAt).toLocaleString('vi-VN')
                      : 'Không rõ'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Cập nhật gần nhất:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentCandidate.updatedAt
                      ? new Date(currentCandidate.updatedAt).toLocaleString('vi-VN')
                      : 'Không rõ'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thư giới thiệu của ứng viên nếu có */}
          {currentCandidate.coverLetter && (
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Thư giới thiệu của ứng viên
              </h4>
              <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {currentCandidate.coverLetter}
              </p>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-end border-t border-gray-200 bg-gray-50 px-6 py-3.5 dark:border-gray-800 dark:bg-gray-850">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailModal;
