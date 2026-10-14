import React, { useState } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Maximize2,
  X,
  History,
  FileCheck,
  Eye,
} from 'lucide-react';
import type { ApplicationRecord } from '../../types/candidate';

export interface InlineCVPreviewProps {
  currentCV?: {
    fileName: string;
    fileSize: number;
    fileType: 'pdf' | 'docx';
    fileUrl: string;
    applicationTitle?: string;
    appliedAt?: string;
  };
  currentCv?: {
    fileName: string;
    fileSize: number;
    fileType: 'pdf' | 'docx';
    fileUrl: string;
    applicationTitle?: string;
    appliedAt?: string;
  };
  applications?: ApplicationRecord[];
  allApplications?: ApplicationRecord[];
  activeApplicationId: string;
  onSelectApplication: (applicationId: string) => void;
  className?: string;
}

export const InlineCVPreview: React.FC<InlineCVPreviewProps> = ({
  currentCV: propCurrentCV,
  currentCv: propCurrentCv,
  applications: propApplications,
  allApplications: propAllApplications,
  activeApplicationId,
  onSelectApplication,
  className = '',
}) => {
  const currentCV = propCurrentCV || propCurrentCv || {
    fileName: 'CV_document.pdf',
    fileSize: 0,
    fileType: 'pdf' as const,
    fileUrl: '',
  };
  const applications = propApplications || propAllApplications || [];
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isPdf = currentCV.fileType === 'pdf' || currentCV.fileName.toLowerCase().endsWith('.pdf');

  const renderViewerContent = (_inModal = false) => {
    if (isPdf && !iframeError) {
      return (
        <div className="relative h-full w-full bg-slate-800">
          <iframe
            src={`${currentCV.fileUrl}#toolbar=1&navpanes=0`}
            title={`Xem trước CV: ${currentCV.fileName}`}
            onError={() => setIframeError(true)}
            className="h-full w-full border-0 rounded-b-2xl"
          />
        </div>
      );
    }

    // Giao diện xem trước cho tệp DOCX hoặc PDF Fallback
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-b-2xl border-t border-slate-200">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100 text-blue-600 shadow-xs mb-4">
          <FileText className="h-10 w-10 stroke-[1.75]" />
        </div>

        <h4 className="text-base font-bold text-slate-800 max-w-sm truncate" title={currentCV.fileName}>
          {currentCV.fileName}
        </h4>
        <p className="mt-1 text-xs text-slate-500">
          Định dạng: <strong>{currentCV.fileType.toUpperCase()}</strong> • Dung lượng: {formatFileSize(currentCV.fileSize)}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={currentCV.fileUrl}
            download={currentCV.fileName}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <Download className="h-4 w-4" />
            <span>Tải xuống tệp CV</span>
          </a>

          <a
            href={currentCV.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Mở trong tab mới</span>
          </a>
        </div>

        <p className="mt-4 text-[11px] text-slate-400 max-w-xs leading-relaxed">
          {isPdf
            ? 'Trình duyệt không hỗ trợ nhúng trực tiếp tệp PDF này. Bạn có thể mở trong tab mới hoặc tải về máy.'
            : 'Tệp định dạng Word (.docx) được khuyến nghị tải về máy để xem chuẩn định dạng bảng biểu và phông chữ gốc.'}
        </p>
      </div>
    );
  };

  return (
    <>
      {/* Khung Inline Preview chính trên trang */}
      <div className={`flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
        {/* Toolbar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 bg-slate-50/90 p-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Eye className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 truncate" title={currentCV.fileName}>
                  {currentCV.fileName}
                </span>
                <span className="rounded-md bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 uppercase">
                  {currentCV.fileType}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {formatFileSize(currentCV.fileSize)} • Xem trước trực tiếp
              </p>
            </div>
          </div>

          {/* Công cụ & Chọn CV theo lần ứng tuyển */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ chọn CV của các đợt ứng tuyển (AC 2 & AC 3) */}
            {applications.length > 1 && (
              <div className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={activeApplicationId}
                  onChange={(e) => onSelectApplication(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-indigo-500"
                  title="Chọn CV của lần ứng tuyển khác"
                >
                  {applications.map((app, idx) => (
                    <option key={app.id} value={app.id}>
                      {idx === 0 ? 'CV Hiện tại' : `CV Đợt ${idx + 1}`} ({app.jobCode || app.jobTitle.slice(0, 18)}...)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Nút Tải xuống */}
            <a
              href={currentCV.fileUrl}
              download={currentCV.fileName}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition shadow-2xs"
              title="Tải xuống tệp CV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tải về</span>
            </a>

            {/* Nút Mở tab mới */}
            <a
              href={currentCV.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              title="Mở trong tab mới"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {/* Nút Toàn màn hình */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition shadow-2xs cursor-pointer"
              title="Phóng to toàn màn hình"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Khung nội dung tài liệu */}
        <div className="relative flex-1 min-h-[500px] h-[calc(100vh-240px)]">
          {renderViewerContent(false)}
        </div>
      </div>

      {/* Modal Xem Toàn màn hình (Full Screen Modal) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-md">
          {/* Header Modal Fullscreen */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3 text-white">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-sm font-bold text-white">{currentCV.fileName}</p>
                <p className="text-[11px] text-slate-400">
                  {formatFileSize(currentCV.fileSize)} • Chế độ xem toàn màn hình
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={currentCV.fileUrl}
                download={currentCV.fileName}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Tải về</span>
              </a>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="rounded-xl bg-white/10 p-2 text-slate-300 hover:bg-white/20 hover:text-white transition cursor-pointer"
                title="Đóng toàn màn hình"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body Viewer Fullscreen */}
          <div className="flex-1 overflow-hidden p-4 sm:p-6">
            <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl">
              {renderViewerContent(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InlineCVPreview;
