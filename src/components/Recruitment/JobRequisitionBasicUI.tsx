import React, { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HeadcountOverrideModal } from "./HeadcountOverrideModal";

// Zod schema for form validation
const basicInfoSchema = z.object({
  jobTitle: z.string().min(1, "Vui lòng nhập chức danh cần tuyển."),
  department: z.string().min(1, "Vui lòng chọn phòng ban."),
  level: z.string().min(1, "Vui lòng chọn cấp bậc."),
  headcount: z.number().min(1, "Số lượng cần tuyển phải lớn hơn 0."),
  jobType: z.string().min(1, "Vui lòng chọn loại hình công việc."),
  expectedJoinDate: z.string().min(1, "Vui lòng chọn ngày cần nhân sự."),
  isOverride: z.boolean().optional(),
  overrideReason: z.string().optional(),
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
    control,
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
      isOverride: false,
      overrideReason: "",
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remainingHeadcount, setRemainingHeadcount] = useState<number>(0);

  // Mock currentUserRole (in real app, get from Context/Redux)
  const currentUserRole = "HR_MANAGER"; 

  const selectedDepartment = useWatch({ control, name: "department" });
  const selectedHeadcount = useWatch({ control, name: "headcount" });

  useEffect(() => {
    if (selectedDepartment) {
      // Mock API call to get remaining headcount based on department
      // Example: IT has 2, HR has 5, etc.
      const mockHeadcountData: Record<string, number> = {
        IT: 2,
        HR: 5,
        Marketing: 1,
      };
      setRemainingHeadcount(mockHeadcountData[selectedDepartment] || 0);
    } else {
      setRemainingHeadcount(0);
    }
  }, [selectedDepartment]);

  const isOverHeadcount = useMemo(() => {
    if (!selectedDepartment) return false;
    return (selectedHeadcount || 0) > remainingHeadcount;
  }, [selectedDepartment, selectedHeadcount, remainingHeadcount]);

  const handleNormalSubmit = () => {
    if (isOverHeadcount) return;
    handleSubmit((data) => {
      data.isOverride = false;
      data.overrideReason = "";
      console.log("Job Requisition Basic Data:", data);
      if (onNext) onNext(data);
    })();
  };

  const handleOverrideSubmit = (reason: string) => {
    handleSubmit((data) => {
      data.isOverride = true;
      data.overrideReason = reason;
      console.log("Job Requisition Basic Data (Override):", data);
      setIsModalOpen(false);
      if (onNext) onNext(data);
    })();
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverHeadcount && currentUserRole === "HR_MANAGER") {
      // Just prevent default, don't open modal automatically, they must click the override button
      return;
    }
    handleNormalSubmit();
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

        <form onSubmit={onFormSubmit} className="p-6 sm:p-8">
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
            <div className="md:col-span-2 lg:col-span-1">
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
                {...register("headcount", { valueAsNumber: true })}
              />
              {selectedDepartment && (
                <p className={`mt-1.5 text-sm font-medium ${isOverHeadcount ? 'text-rose-600' : 'text-emerald-600'}`}>
                  Định biên còn lại: {remainingHeadcount}
                </p>
              )}
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

          {/* Alert Cảnh báo vượt định biên */}
          {isOverHeadcount && (
            <div className="mt-8 rounded-lg border-l-4 border-rose-500 bg-rose-50 p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-rose-800">Cảnh báo vượt định biên!</h3>
                  <p className="text-sm text-rose-700 mt-1">
                    Số lượng yêu cầu tuyển ({selectedHeadcount}) đang vượt quá định biên cho phép của phòng ban ({remainingHeadcount}).
                    {currentUserRole !== 'HR_MANAGER' && " Bạn không thể tạo yêu cầu này."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleNormalSubmit}
              disabled={isOverHeadcount}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition focus:outline-none focus:ring-2 ${
                isOverHeadcount 
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200'
              }`}
            >
              Tiếp tục
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {isOverHeadcount && currentUserRole === 'HR_MANAGER' && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Tiếp tục & Ghi đè chỉ tiêu
              </button>
            )}
          </div>
        </form>
      </div>

      <HeadcountOverrideModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleOverrideSubmit}
      />
    </div>
  );
};

export default JobRequisitionBasicUI;
