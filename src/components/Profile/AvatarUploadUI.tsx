import React, { useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  avatarService,
  getAvatarErrorMessage,
  type UploadAvatarResponse,
} from "../../services/avatarService";
import { validateAvatarFile } from "./avatarValidation";
import {
  generateCroppedFile,
  getInitialSquareCrop,
} from "./cropImageHelper";

export interface AvatarUploadUIProps {
  currentAvatarUrl?: string | null;
  fullName?: string;
  hasAvatar?: boolean;
  onSave?: (file: File) => void;
  onUploadSuccess?: (response: UploadAvatarResponse) => void;
  onDeleteSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const AvatarUploadUI: React.FC<AvatarUploadUIProps> = ({
  currentAvatarUrl,
  fullName = "Người dùng",
  hasAvatar = false,
  onSave,
  onUploadSuccess,
  onDeleteSuccess,
  onCancel,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageToCropRef = useRef<HTMLImageElement>(null);

  // File và URL hiển thị sau khi đã cắt
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Trạng thái gọi API
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Trạng thái phục vụ Modal cắt ảnh hình vuông
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isProcessingCrop, setIsProcessingCrop] = useState<boolean>(false);

  // Business logic: Lưu trữ blob URL vào ref để dọn dẹp bộ nhớ heap khi Component unmount
  const previewUrlRef = useRef<string | null>(null);
  const rawImageSrcRef = useRef<string | null>(null);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    rawImageSrcRef.current = rawImageSrc;
  }, [rawImageSrc]);

  useEffect(() => {
    return () => {
      // Business logic: Giải phóng bộ nhớ trình duyệt cho tất cả Object URL tạm thời khi unmount
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      if (rawImageSrcRef.current) {
        URL.revokeObjectURL(rawImageSrcRef.current);
      }
    };
  }, []);

  const processFile = (file: File) => {
    const validation = validateAvatarFile(file);

    if (!validation.isValid) {
      setErrorMessage(validation.error || "Tệp không hợp lệ.");
      setSuccessMessage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Business logic: Thu hồi Object URL của file gốc trước đó nếu đang mở modal
    if (rawImageSrc) {
      URL.revokeObjectURL(rawImageSrc);
    }

    // Tạo Object URL cho file gốc và mở Modal cắt ảnh
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setRawFile(file);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCropModalOpen(true);
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

  // Khởi tạo khung cắt hình vuông 1:1 khi ảnh gốc render xong trong Modal
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget;
    const initialCrop = getInitialSquareCrop(width, height);
    setCrop(initialCrop);
  };

  // Áp dụng thao tác cắt ảnh hình vuông
  const handleApplyCrop = async () => {
    if (!imageToCropRef.current || !completedCrop || !rawFile) {
      return;
    }

    setIsProcessingCrop(true);
    try {
      const croppedFile = await generateCroppedFile({
        image: imageToCropRef.current,
        crop: completedCrop,
        fileName: rawFile.name,
        mimeType: rawFile.type || "image/jpeg",
      });

      if (!croppedFile) {
        setErrorMessage("Không thể cắt ảnh. Vui lòng thử lại.");
        return;
      }

      // Business logic: Thu hồi URL ảnh preview cũ trước khi gán URL ảnh mới đã cắt
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const croppedUrl = URL.createObjectURL(croppedFile);
      setSelectedFile(croppedFile);
      setPreviewUrl(croppedUrl);
      setSuccessMessage("Đã cắt ảnh vuông 1:1 thành công. Sẵn sàng lưu lên hệ thống.");

      // Đóng modal và giải phóng Object URL của ảnh gốc
      if (rawImageSrc) {
        URL.revokeObjectURL(rawImageSrc);
      }
      setRawImageSrc(null);
      setRawFile(null);
      setIsCropModalOpen(false);
    } catch {
      setErrorMessage("Đã xảy ra lỗi trong quá trình xử lý cắt ảnh.");
    } finally {
      setIsProcessingCrop(false);
    }
  };

  // Hủy bỏ thao tác cắt ảnh trong Modal
  const handleCancelCropModal = () => {
    if (rawImageSrc) {
      URL.revokeObjectURL(rawImageSrc);
    }
    setRawImageSrc(null);
    setRawFile(null);
    setIsCropModalOpen(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Hủy bỏ toàn bộ lựa chọn ảnh ở giao diện chính
  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onCancel?.();
  };

  // Tải ảnh đại diện lên máy chủ (PUT /profile/avatar)
  const handleSave = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await avatarService.uploadAvatar(selectedFile);
      setSuccessMessage("Tải lên ảnh đại diện thành công!");
      onUploadSuccess?.(response);
      onSave?.(selectedFile);
      setSelectedFile(null);
    } catch (err: unknown) {
      const message = getAvatarErrorMessage(
        err,
        "Không thể tải lên ảnh đại diện. Vui lòng thử lại.",
      );
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Xóa ảnh đại diện khỏi máy chủ (DELETE /profile/avatar)
  const handleDeleteAvatar = async () => {
    const isConfirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa ảnh đại diện hiện tại?",
    );
    if (!isConfirmed) return;

    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await avatarService.deleteAvatar();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      setSuccessMessage("Đã xóa ảnh đại diện thành công.");
      onDeleteSuccess?.();
    } catch (err: unknown) {
      const message = getAvatarErrorMessage(
        err,
        "Không thể xóa ảnh đại diện. Vui lòng thử lại.",
      );
      setErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
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
  const canDeleteCurrentAvatar =
    (hasAvatar || Boolean(currentAvatarUrl)) && !selectedFile;

  return (
    <>
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
                  Đã cắt vuông 1:1
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

            {/* Thông báo lỗi */}
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

            {/* Thông báo thành công */}
            {successMessage && !errorMessage && (
              <div
                aria-live="polite"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-2xs"
                role="status"
              >
                <span>✅</span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Thông tin tệp ảnh hợp lệ đã cắt */}
            {selectedFile && !errorMessage && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-700 sm:justify-start">
                <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                  ✂️ {selectedFile.name}
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
                disabled={isUploading || isDeleting}
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
                disabled={!selectedFile || isUploading || isDeleting}
                id="btn-save-avatar"
                onClick={handleSave}
                type="button"
              >
                {isUploading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </button>

              {/* Nút Xóa ảnh hiện tại từ server */}
              {canDeleteCurrentAvatar && (
                <button
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-2xs transition hover:bg-rose-100 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50"
                  disabled={isDeleting || isUploading}
                  id="btn-delete-avatar"
                  onClick={handleDeleteAvatar}
                  type="button"
                >
                  {isDeleting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>Xóa ảnh hiện tại</span>
                    </>
                  )}
                </button>
              )}

              <button
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-40 disabled:hover:bg-white"
                disabled={(!selectedFile && !errorMessage) || isUploading || isDeleting}
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

      {/* Modal Cắt ảnh hình vuông (1:1) (TKNHTTDNB1-189) */}
      {isCropModalOpen && rawImageSrc && (
        <div
          aria-labelledby="crop-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
          role="dialog"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3
                  className="text-lg font-bold text-slate-900"
                  id="crop-modal-title"
                >
                  Cắt ảnh đại diện
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Điều chỉnh khung hình vuông (1:1) để chọn vùng ảnh đẹp nhất.
                </p>
              </div>
              <button
                aria-label="Đóng cửa sổ cắt ảnh"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                onClick={handleCancelCropModal}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Vùng tương tác cắt ảnh với react-image-crop */}
            <div className="mt-4 flex max-h-[60vh] items-center justify-center overflow-hidden rounded-xl bg-slate-950 p-2">
              <ReactCrop
                aspect={1}
                circularCrop
                className="max-h-[55vh]"
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              >
                <img
                  alt="Ảnh gốc cần cắt"
                  className="max-h-[55vh] max-w-full object-contain"
                  onLoad={handleImageLoad}
                  ref={imageToCropRef}
                  src={rawImageSrc}
                />
              </ReactCrop>
            </div>

            {/* Ghi chú tỷ lệ */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                Tỷ lệ khung: <strong>1:1 (Hình vuông)</strong>
              </span>
              <span>Kéo góc để phóng to/thu nhỏ</span>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                id="btn-cancel-crop"
                onClick={handleCancelCropModal}
                type="button"
              >
                Hủy
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-indigo-300"
                disabled={isProcessingCrop || !completedCrop}
                id="btn-apply-crop"
                onClick={handleApplyCrop}
                type="button"
              >
                {isProcessingCrop ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Áp dụng</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarUploadUI;
