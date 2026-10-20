import React, { useState, useEffect } from "react";
import { careerPageService, type CareerPageConfig, type CareerPageBenefit } from "../../services/careerPageService";
import { useToast } from "../notifications/useToast";

const mockCareerPageData: CareerPageConfig = {
  title: "Gia nhập gia đình TechCorp",
  slogan: "Nơi tài năng của bạn được tỏa sáng và phát triển không giới hạn.",
  aboutUs: "TechCorp là công ty công nghệ hàng đầu, tập trung vào việc tạo ra các giải pháp phần mềm đột phá. Chúng tôi tin rằng con người là tài sản quý giá nhất, và luôn tạo điều kiện tốt nhất để nhân viên phát triển sự nghiệp.",
  benefits: [
    { title: "Lương thưởng cạnh tranh, tháng lương 13", description: "" },
    { title: "Bảo hiểm sức khỏe cao cấp", description: "" },
    { title: "Môi trường làm việc năng động, sáng tạo", description: "" },
    { title: "Cơ hội đào tạo và thăng tiến rõ ràng", description: "" },
  ],
  coverImageUrl: "",
};

export const CareerPageEditorUI: React.FC = () => {
  const [config, setConfig] = useState<CareerPageConfig>(mockCareerPageData);
  const [newBenefitTitle, setNewBenefitTitle] = useState("");
  const [newBenefitDesc, setNewBenefitDesc] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    let isCancelled = false;
    
    careerPageService.getCareerPage()
      .then((data) => {
        if (!isCancelled) setConfig(data);
      })
      .catch((err) => {
        console.error(err);
        if (!isCancelled) {
          notify("Không thể tải cấu hình từ máy chủ, đang dùng dữ liệu mẫu", "error");
          setConfig(mockCareerPageData);
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [notify]);

  const handleConfigChange = (
    field: keyof CareerPageConfig,
    value: string | CareerPageBenefit[],
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddBenefit = () => {
    if (newBenefitTitle.trim()) {
      handleConfigChange("benefits", [
        ...config.benefits, 
        { title: newBenefitTitle.trim(), description: newBenefitDesc.trim() || undefined }
      ]);
      setNewBenefitTitle("");
      setNewBenefitDesc("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    const updatedBenefits = config.benefits.filter((_, i) => i !== index);
    handleConfigChange("benefits", updatedBenefits);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await careerPageService.updateCareerPage(config);
      setConfig(updated);
      notify("Đã lưu cấu hình thành công", "success");
    } catch (error) {
      console.error(error);
      notify("Lỗi khi lưu cấu hình", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    alert("Chế độ xem trước (Chuẩn bị cho task 235)");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="animate-pulse font-medium text-slate-500">Đang tải cấu hình...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Thiết lập Trang Tuyển Dụng
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cấu hình nội dung giới thiệu công ty và hiển thị trên trang tuyển dụng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
            disabled={isSaving}
            type="button"
          >
            Hủy bỏ
          </button>
          <button
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-xs transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
            onClick={handlePreview}
            disabled={isSaving}
            type="button"
          >
            Xem trước
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-400"
            onClick={handleSave}
            disabled={isSaving}
            type="button"
          >
            {isSaving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Lưu cấu hình
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Basic Info Section */}
        <div className="border-b border-slate-200 p-6 sm:p-8">
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            Thông tin cơ bản
          </h2>
          <div className="space-y-5">
            <div>
              <label
                className="mb-1.5 block text-sm font-semibold text-slate-700"
                htmlFor="title"
              >
                Tiêu đề trang
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                id="title"
                onChange={(e) => handleConfigChange("title", e.target.value)}
                placeholder="Ví dụ: Tuyển dụng tại công ty XYZ"
                type="text"
                value={config.title}
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-sm font-semibold text-slate-700"
                htmlFor="slogan"
              >
                Khẩu hiệu (Slogan)
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                id="slogan"
                onChange={(e) => handleConfigChange("slogan", e.target.value)}
                placeholder="Câu khẩu hiệu hấp dẫn..."
                type="text"
                value={config.slogan}
              />
            </div>
          </div>
        </div>

        {/* Cover Image Section */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-6 sm:p-8">
          <h2 className="mb-5 text-lg font-bold text-slate-900">Ảnh bìa</h2>
          <div className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition group-hover:scale-110 group-hover:bg-indigo-200">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">
              Kéo thả ảnh vào đây, hoặc{" "}
              <span className="cursor-pointer text-indigo-600 hover:underline">
                chọn file
              </span>
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Định dạng PNG, JPG hoặc WEBP. Kích thước tối đa 5MB.
            </p>
          </div>
        </div>

        {/* About Us Section */}
        <div className="border-b border-slate-200 p-6 sm:p-8">
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            Đoạn văn giới thiệu
          </h2>
          <div>
            <textarea
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              id="aboutUs"
              onChange={(e) => handleConfigChange("aboutUs", e.target.value)}
              placeholder="Nhập nội dung giới thiệu về môi trường làm việc, văn hóa công ty..."
              rows={6}
              value={config.aboutUs}
            />
          </div>
        </div>

        {/* Benefits Section */}
        <div className="p-6 sm:p-8">
          <h2 className="mb-1.5 text-lg font-bold text-slate-900">
            Giá trị cốt lõi / Chế độ phúc lợi
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Thêm các quyền lợi nổi bật để thu hút ứng viên tiềm năng.
          </p>

          <div className="space-y-3">
            {config.benefits.map((benefit, index) => (
              <div
                key={benefit.id || index}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 transition hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    ✓
                  </span>
                  <div>
                    <span className="block text-sm font-medium text-slate-700">
                      {benefit.title}
                    </span>
                    {benefit.description && (
                      <span className="block text-xs text-slate-500">
                        {benefit.description}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="text-slate-400 transition hover:text-rose-600 focus:outline-none"
                  onClick={() => handleRemoveBenefit(index)}
                  title="Xóa phúc lợi"
                  type="button"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase text-slate-500">Thêm phúc lợi mới</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                onChange={(e) => setNewBenefitTitle(e.target.value)}
                placeholder="Tên phúc lợi (VD: Hỗ trợ ăn trưa)..."
                type="text"
                value={newBenefitTitle}
              />
              <input
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                onChange={(e) => setNewBenefitDesc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddBenefit();
                  }
                }}
                placeholder="Mô tả ngắn (không bắt buộc)..."
                type="text"
                value={newBenefitDesc}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                onClick={handleAddBenefit}
                type="button"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 4v16m8-8H4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerPageEditorUI;
