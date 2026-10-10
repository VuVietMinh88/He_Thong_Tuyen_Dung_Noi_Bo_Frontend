import React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Zod schema for form validation
const detailsSchema = z.object({
  jobDescription: z.string().min(1, "Vui lòng nhập mô tả công việc."),
  requirements: z.string().min(1, "Vui lòng nhập yêu cầu ứng viên."),
  benefits: z.string().min(1, "Vui lòng nhập quyền lợi được hưởng."),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

export interface JobRequisitionDetailsUIProps {
  onBack?: () => void;
  onSubmitComplete?: (data: DetailsFormValues) => void;
}

export const JobRequisitionDetailsUI: React.FC<JobRequisitionDetailsUIProps> = ({
  onBack,
  onSubmitComplete,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      jobDescription: "",
      requirements: "",
      benefits: "",
    },
  });

  const onSubmit: SubmitHandler<DetailsFormValues> = (data) => {
    console.log("Job Requisition Details Data:", data);
    if (onSubmitComplete) {
      onSubmitComplete(data);
    } else {
      alert("Đã tạo yêu cầu tuyển dụng thành công! (Xem console log)");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Tạo Yêu cầu Tuyển dụng
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Bước 2/2: Soạn thảo nội dung chi tiết cho vị trí tuyển dụng.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-slate-50/50 p-6">
          <h2 className="text-lg font-bold text-slate-900">Chi tiết công việc</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8">
          <div className="flex flex-col gap-8">
            {/* Job Description */}
            <div>
              <label
                htmlFor="jobDescription"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Mô tả công việc (Job Description) <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="jobDescription"
                rows={5}
                placeholder="Nhập các nhiệm vụ, công việc chính mà ứng viên sẽ đảm nhận..."
                className={`w-full rounded-xl border px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-xs outline-none transition focus:ring-2 ${
                  errors.jobDescription
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
                {...register("jobDescription")}
              />
              {errors.jobDescription && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.jobDescription.message}
                </p>
              )}
            </div>

            {/* Requirements */}
            <div>
              <label
                htmlFor="requirements"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Yêu cầu ứng viên (Requirements) <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="requirements"
                rows={5}
                placeholder="Nhập các kỹ năng, kinh nghiệm, bằng cấp bắt buộc hoặc ưu tiên..."
                className={`w-full rounded-xl border px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-xs outline-none transition focus:ring-2 ${
                  errors.requirements
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
                {...register("requirements")}
              />
              {errors.requirements && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.requirements.message}
                </p>
              )}
            </div>

            {/* Benefits */}
            <div>
              <label
                htmlFor="benefits"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Quyền lợi được hưởng (Benefits) <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="benefits"
                rows={5}
                placeholder="Nhập các chế độ đãi ngộ, lương thưởng, môi trường làm việc..."
                className={`w-full rounded-xl border px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-xs outline-none transition focus:ring-2 ${
                  errors.benefits
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
                {...register("benefits")}
              />
              {errors.benefits && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.benefits.message}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-10 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Quay lại
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              Tạo yêu cầu tuyển dụng
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobRequisitionDetailsUI;
