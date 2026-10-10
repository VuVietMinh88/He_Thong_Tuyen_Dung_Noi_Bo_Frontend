import React, { useState } from "react";

export interface CareerPageConfig {
  title: string;
  slogan: string;
  aboutUs: string;
  benefits: string[];
  coverImageUrl: string;
}

const mockCareerPageData: CareerPageConfig = {
  title: "Gia nhập gia đình TechCorp",
  slogan: "Nơi tài năng của bạn được tỏa sáng và phát triển không giới hạn.",
  aboutUs: "TechCorp là công ty công nghệ hàng đầu, tập trung vào việc tạo ra các giải pháp phần mềm đột phá. Chúng tôi tin rằng con người là tài sản quý giá nhất, và luôn tạo điều kiện tốt nhất để nhân viên phát triển sự nghiệp.",
  benefits: [
    "Lương thưởng cạnh tranh, tháng lương 13",
    "Bảo hiểm sức khỏe cao cấp",
    "Môi trường làm việc năng động, sáng tạo",
    "Cơ hội đào tạo và thăng tiến rõ ràng",
  ],
  coverImageUrl: "",
};

export const CareerPageEditorUI: React.FC = () => {
  const [config, setConfig] = useState<CareerPageConfig>(mockCareerPageData);
  const [newBenefit, setNewBenefit] = useState("");

  const handleConfigChange = (
    field: keyof CareerPageConfig,
    value: string | string[],
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      handleConfigChange("benefits", [...config.benefits, newBenefit.trim()]);
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    const updatedBenefits = config.benefits.filter((_, i) => i !== index);
    handleConfigChange("benefits", updatedBenefits);
  };

  const handleSave = () => {
    console.log("Saving Career Page Config:", config);
    alert("Đã lưu cấu hình (Xem console log)");
  };

  const handlePreview = () => {
    console.log("Previewing Career Page Config:", config);
    alert("Chế độ xem trước (Chuẩn bị cho task 235)");
  };

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
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            type="button"
          >
            Hủy bỏ
          </button>
          <button
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-xs transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            onClick={handlePreview}
            type="button"
          >
            Xem trước
          </button>
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            onClick={handleSave}
            type="button"
          >
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
                key={index}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 transition hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    ✓
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {benefit}
                  </span>
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

          <div className="mt-5 flex items-center gap-3">
            <input
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              onChange={(e) => setNewBenefit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddBenefit();
                }
              }}
              placeholder="Nhập tên phúc lợi mới (VD: Hỗ trợ ăn trưa, làm việc từ xa)..."
              type="text"
              value={newBenefit}
            />
            <button
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
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
              Thêm phúc lợi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerPageEditorUI;
