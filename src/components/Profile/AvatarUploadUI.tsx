import React, { useEffect, useRef, useState } from "react";
import { validateAvatarFile } from "./avatarValidation";

export interface AvatarUploadUIProps {
  currentAvatarUrl?: string | null;
  fullName?: string;
  onSave?: (file: File) => void;
  onCancel?: () => void;
  className?: string;
}

export const AvatarUploadUI: React.FC<AvatarUploadUIProps> = ({
  currentAvatarUrl,
  fullName = "Người dùng",
  onSave,
  onCancel,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Business logic: Lưu trữ blob URL vào ref để dọn dẹp bộ nhớ heap khi Component unmount.
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      // Business logic: Giải phóng bộ nhớ trình duyệt đã cấp phát cho Object URL tạm thời
      // nhằm ngăn ngừa rò rỉ bộ nhớ (memory leak) khi component unmount.
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const processFile = (file: File) => {
    const validation = validateAvatarFile(file);

    if (!validation.isValid) {
      // Business logic: Nếu file vi phạm, không hiển thị xem trước, xóa file đã chọn
      // và reset input element để người dùng có thể thử chọn lại cùng một file.
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSelectedFile(null);
      setErrorMessage(validation.error || "Tệp không hợp lệ.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Business logic: Khi chọn file mới hợp lệ, thu hồi URL tạm của file trước đó để tránh lãng phí RAM.
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setErrorMessage(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCancel = () => {
    // Business logic: Thu hồi Object URL đã tạo khi người dùng hủy bỏ ảnh đang xem trước.
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setErrorMessage(null);

    // Business logic: Reset giá trị của thẻ input để có thể chọn lại file vừa chọn nếu muốn.
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onCancel?.();
  };

  const handleSave = () => {
    if (!selectedFile) return;

    // Subtask 185: Client-side UI & preview logic, ghi log chuẩn bị cho task tích hợp API 188.
    console.log("Selected avatar file ready for upload:", {
      name: selectedFile.name,
      size: `${(selectedFile.size / 1024).toFixed(1)} KB`,
      type: selectedFile.type,
    });

    onSave?.(selectedFile);
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const displayAvatarSrc = previewUrl || currentAvatarUrl;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-xs ${className}`}
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Vùng hiển thị ảnh đại diện tròn có hiệu ứng hover đổi ảnh */}
        <div
          aria-label="Khu vực tải lên ảnh đại diện"
          className={`group relative flex h-36 w-36 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-md ring-2 transition-all ${
            isDragOver
              ? "ring-indigo-500 scale-105"
              : "ring-slate-200 hover:ring-indigo-300"
          }`}
          onClick={handleOpenFileDialog}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpenFileDialog();
            }
          }}
        >
          {displayAvatarSrc ? (
            <img
              alt={`Ảnh đại diện của ${fullName}`}
              className="h-full w-full rounded-full object-cover"
              src={displayAvatarSrc}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-indigo-700 text-3xl font-bold text-white">
              <span>{getInitials(fullName)}</span>
            </div>
          )}

          {/* Lớp phủ mờ hiển thị icon camera khi rê chuột */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-slate-900/50 text-white opacity-0 backdrop-blur-2xs transition-opacity duration-200 group-hover:opacity-100">
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="mt-1 text-xs font-semibold">Đổi ảnh</span>
          </div>
        </div>

        {/* Khu vực chi tiết, điều khiển và các nút thao tác */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h3 className="text-base font-bold text-slate-900">
              Ảnh đại diện cá nhân
            </h3>
            {previewUrl && (
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                Ảnh xem trước mới
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Định dạng tệp được hỗ trợ: <strong className="text-slate-700">JPG, PNG</strong>. Dung lượng tối đa: <strong className="text-slate-700">2MB</strong>.
          </p>

          {/* Thẻ input ẩn chọn tệp */}
          <input
            accept="image/jpeg,image/png"
            className="hidden"
            id="avatar-file-input"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />

          {/* Thông báo lỗi định dạng hoặc dung lượng vượt quá 2MB */}
          {errorMessage && (
            <div
              aria-live="assertive"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-2xs"
              role="alert"
            >
              <svg
                className="h-4 w-4 shrink-0 text-rose-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Thông tin tệp ảnh hợp lệ vừa chọn */}
          {selectedFile && !errorMessage && (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-700 sm:justify-start">
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                📄 {selectedFile.name}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-medium text-slate-500">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
          )}

          {/* Hàng nút bấm hành động */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
            <button
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              id="btn-change-avatar"
              onClick={handleOpenFileDialog}
              type="button"
            >
              <svg
                className="h-4 w-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{selectedFile ? "Chọn ảnh khác" : "Thay đổi ảnh"}</span>
            </button>

            <button
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!selectedFile}
              id="btn-save-avatar"
              onClick={handleSave}
              type="button"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Lưu ảnh</span>
            </button>

            <button
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-40 disabled:hover:bg-white"
              disabled={!selectedFile && !errorMessage}
              id="btn-cancel-avatar"
              onClick={handleCancel}
              type="button"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarUploadUI;
