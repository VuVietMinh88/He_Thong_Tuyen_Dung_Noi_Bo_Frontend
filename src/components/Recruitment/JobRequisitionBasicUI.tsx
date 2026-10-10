import React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Zod schema for form validation
const basicInfoSchema = z.object({
  jobTitle: z.string().min(1, "Vui lòng nhập chức danh cần tuyển."),
  department: z.string().min(1, "Vui lòng chọn phòng ban."),
  level: z.string().min(1, "Vui lòng chọn cấp bậc."),
  headcount: z.preprocess(
    (val) => (val ? Number(val) : 0),
    z.number().min(1, "Số lượng cần tuyển phải lớn hơn 0."),
  ),
  jobType: z.string().min(1, "Vui lòng chọn loại hình công việc."),
  expectedJoinDate: z.string().min(1, "Vui lòng chọn ngày cần nhân sự."),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

export interface JobRequisitionBasicUIProps {
  onNext?: (data: BasicInfoFormValues) => void;
  onCancel?: () => void;
}

const mockDepartments = [
  { value: "IT", label: "Phòng IT (Công nghệ thông tin)" },
  { value: "HR", label: "Phòng Nhân sự" },
  { value: "Marketing", label: "Phòng Marketing" },
];

const mockLevels = [
  { value: "Intern", label: "Thực tập sinh (Intern)" },
  { value: "Fresher", label: "Nhân viên mới (Fresher)" },
  { value: "Junior", label: "Sơ cấp (Junior)" },
  { value: "Middle", label: "Trung cấp (Middle)" },
  { value: "Senior", label: "Cao cấp (Senior)" },
  { value: "Manager", label: "Quản lý (Manager)" },
];

const mockJobTypes = [
  { value: "Full-time", label: "Toàn thời gian (Full-time)" },
  { value: "Part-time", label: "Bán thời gian (Part-time)" },
  { value: "Remote", label: "Làm việc từ xa (Remote)" },
];

export const JobRequisitionBasicUI: React.FC<JobRequisitionBasicUIProps> = ({
  onNext,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      jobTitle: "",
      department: "",
      level: "",
      headcount: 1,
      jobType: "",
      expectedJoinDate: "",
    },
  });

  const onSubmit: SubmitHandler<BasicInfoFormValues> = (data) => {
    console.log("Job Requisition Basic Data:", data);
    if (onNext) {
      onNext(data);
    } else {
      alert("Dữ liệu hợp lệ! (Xem console log)");
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
          Bước 1/2: Nhập các thông tin cơ bản về vị trí cần tuyển.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-slate-50/50 p-6">
          <h2 className="text-lg font-bold text-slate-900">Thông tin cơ bản</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {/* Job Title */}
            <div className="md:col-span-2">
              <label
                htmlFor="jobTitle"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Chức danh cần tuyển <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="jobTitle"
                placeholder="VD: Senior Frontend Developer"
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition focus:ring-2 ${
                  errors.jobTitle
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
                {...register("jobTitle")}
              />
              {errors.jobTitle && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.jobTitle.message}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="department"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Phòng ban <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="department"
                  className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition focus:ring-2 ${
                    errors.department
                      ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                      : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                  {...register("department")}
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {mockDepartments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {errors.department && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.department.message}
                </p>
              )}
            </div>

            {/* Level */}
            <div>
              <label
                htmlFor="level"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Cấp bậc <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="level"
                  className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition focus:ring-2 ${
                    errors.level
                      ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                      : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                  {...register("level")}
                >
                  <option value="">-- Chọn cấp bậc --</option>
                  {mockLevels.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {errors.level && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.level.message}
                </p>
              )}
            </div>

            {/* Headcount */}
            <div>
              <label
                htmlFor="headcount"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Số lượng cần tuyển <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                id="headcount"
                min={1}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition focus:ring-2 ${
                  errors.headcount
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
                {...register("headcount")}
              />
              {errors.headcount && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.headcount.message}
                </p>
              )}
            </div>

            {/* Job Type */}
            <div>
              <label
                htmlFor="jobType"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Loại hình công việc <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="jobType"
                  className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition focus:ring-2 ${
                    errors.jobType
                      ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                      : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                  {...register("jobType")}
                >
                  <option value="">-- Chọn loại hình --</option>
                  {mockJobTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {errors.jobType && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.jobType.message}
                </p>
              )}
            </div>

            {/* Expected Join Date */}
            <div>
              <label
                htmlFor="expectedJoinDate"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Ngày cần nhân sự <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="expectedJoinDate"
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition focus:ring-2 ${
                  errors.expectedJoinDate
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                }`}
                {...register("expectedJoinDate")}
              />
              {errors.expectedJoinDate && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.expectedJoinDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-10 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              Tiếp tục
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobRequisitionBasicUI;
