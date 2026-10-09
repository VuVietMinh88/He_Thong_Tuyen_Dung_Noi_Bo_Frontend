import {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";

export interface GenerateCroppedFileOptions {
  image: HTMLImageElement;
  crop: PixelCrop;
  fileName: string;
  mimeType?: string;
  outputSize?: number;
}

/**
 * Tính toán khung cắt hình vuông 1:1 ban đầu căn giữa hình ảnh.
 */
export const getInitialSquareCrop = (
  width: number,
  height: number,
): Crop => {
  // Business logic: Tự động khởi tạo khung cắt tỷ lệ 1:1 chiếm 80% chiều ngắn hơn của ảnh
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80,
      },
      1,
      width,
      height,
    ),
    width,
    height,
  );
};

/**
 * Trích xuất vùng ảnh hình vuông từ phần tử img sang thẻ canvas ẩn.
 * Ánh xạ chính xác tọa độ pixel hiển thị trên màn hình sang tọa độ pixel ảnh gốc.
 */
export const getCroppedCanvas = (
  image: HTMLImageElement,
  crop: PixelCrop,
  outputSize?: number,
): HTMLCanvasElement | null => {
  if (!crop.width || !crop.height) {
    return null;
  }

  // Business logic: Tính toán tỷ lệ co giãn giữa kích thước gốc (natural) và kích thước hiển thị trên UI
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Business logic: Chuyển đổi tọa độ khung crop trên UI sang tọa độ thực tế trên file ảnh gốc
  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  const canvas = document.createElement("canvas");
  const targetWidth = outputSize ? outputSize : Math.floor(cropWidth);
  const targetHeight = outputSize ? outputSize : Math.floor(cropHeight);

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Business logic: Vẽ phần ảnh được chọn từ ảnh gốc lên canvas đích
  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return canvas;
};

/**
 * Tạo đối tượng File mới từ vùng ảnh đã cắt thông qua thẻ canvas.
 */
export const generateCroppedFile = (
  options: GenerateCroppedFileOptions,
): Promise<File | null> => {
  return new Promise((resolve) => {
    const { image, crop, fileName, mimeType = "image/jpeg", outputSize } = options;
    const canvas = getCroppedCanvas(image, crop, outputSize);

    if (!canvas) {
      resolve(null);
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        // Business logic: Đóng gói Blob thành File hoàn chỉnh giữ nguyên tên và mimeType
        const file = new File([blob], fileName, {
          type: mimeType,
          lastModified: Date.now(),
        });
        resolve(file);
      },
      mimeType,
      0.95,
    );
  });
};
