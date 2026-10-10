import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Plus, Trash2, ArrowDown, Save, Loader2 } from "lucide-react";
import { approvalService, type ApprovalWorkflowPayload } from "../../services/approvalService";

interface ApprovalStep {
  approverType: "ROLE" | "USER";
  targetId: string; // roleId or userId
}

interface ApprovalWorkflowForm {
  steps: ApprovalStep[];
}

const mockRoles = [
  { id: "ROLE_DEPT_MANAGER", name: "Trưởng phòng (Department Manager)" },
  { id: "ROLE_DIRECTOR", name: "Giám đốc (Director)" },
  { id: "ROLE_HR", name: "Nhân sự (HR)" },
];

const mockUsers = [
  { id: "USER_1", name: "Nguyễn Văn A - CEO" },
  { id: "USER_2", name: "Trần Thị B - HR Manager" },
  { id: "USER_3", name: "Lê Văn C - Tech Lead" },
];

export const ApprovalWorkflowConfigUI: React.FC = () => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApprovalWorkflowForm>({
    defaultValues: {
      steps: [
        { approverType: "ROLE", targetId: "ROLE_DEPT_MANAGER" },
        { approverType: "USER", targetId: "USER_1" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: ApprovalWorkflowForm) => {
    if (data.steps.length === 0) {
      setErrorMessage("Luồng phê duyệt phải có ít nhất 1 cấp.");
      return;
    }
    
    setErrorMessage(null);
    setIsSubmitting(true);
    
    try {
      const payload: ApprovalWorkflowPayload = {
        steps: data.steps.map((step, index) => ({
          level: index + 1,
          roleId: step.approverType === "ROLE" ? step.targetId : null,
          userId: step.approverType === "USER" ? step.targetId : null,
        })),
      };
      
      await approvalService.saveConfig(payload);
      alert("Lưu cấu hình thành công!");
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Đã có lỗi xảy ra khi lưu cấu hình.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      {/* Overlay for loading */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-xl">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-600" strokeWidth={3} />
            <p className="font-semibold text-slate-800">Đang lưu cấu hình...</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm animate-in fade-in slide-in-from-top-2">
          <p className="font-medium">Lỗi: {errorMessage}</p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Cấu hình luồng phê duyệt
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Thiết lập các cấp phê duyệt tuần tự cho Yêu cầu tuyển dụng.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {fields.map((field, index) => {
              const currentType = watch(`steps.${index}.approverType`);
              
              return (
                <div key={field.id} className="relative">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition-all hover:border-indigo-200 hover:shadow-sm">
                    {/* Card Header */}
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                      <h3 className="text-sm font-bold text-slate-800">
                        Cấp phê duyệt {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600 focus:outline-none"
                        title="Xóa cấp này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Loại người duyệt
                        </label>
                        <div className="relative">
                          <Controller
                            control={control}
                            name={`steps.${index}.approverType`}
                            render={({ field }) => (
                              <select
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Reset targetId when changing type
                                  setValue(`steps.${index}.targetId`, "");
                                }}
                                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                              >
                                <option value="ROLE">Theo vai trò</option>
                                <option value="USER">Người dùng cụ thể</option>
                              </select>
                            )}
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          {currentType === "ROLE" ? "Chọn vai trò" : "Chọn người dùng"}
                        </label>
                        <div className="relative">
                          <Controller
                            control={control}
                            name={`steps.${index}.targetId`}
                            rules={{ required: "Vui lòng chọn người duyệt" }}
                            render={({ field: { onChange, value } }) => (
                              <select
                                value={value}
                                onChange={onChange}
                                className={`w-full appearance-none rounded-lg border px-3 py-2.5 text-sm shadow-xs outline-none transition focus:ring-2 ${
                                  errors.steps?.[index]?.targetId
                                    ? "border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-200"
                                    : "border-slate-300 bg-white text-slate-700 focus:border-indigo-500 focus:ring-indigo-100"
                                }`}
                              >
                                <option value="">-- Chọn --</option>
                                {currentType === "ROLE"
                                  ? mockRoles.map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {r.name}
                                      </option>
                                    ))
                                  : mockUsers.map((u) => (
                                      <option key={u.id} value={u.id}>
                                        {u.name}
                                      </option>
                                    ))}
                              </select>
                            )}
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {errors.steps?.[index]?.targetId && (
                          <p className="mt-1.5 text-xs font-medium text-rose-500">
                            {errors.steps[index]?.targetId?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrow Indicator between steps */}
                  {index < fields.length - 1 && (
                    <div className="absolute -bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xs">
                        <ArrowDown className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Step Button */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => append({ approverType: "ROLE", targetId: "" })}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none"
            >
              <Plus className="h-5 w-5" />
              Thêm cấp phê duyệt
            </button>
          </div>

          {/* Submit Actions */}
          <div className="mt-10 flex justify-end border-t border-slate-100 pt-6">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              <Save className="h-4 w-4" />
              Lưu cấu hình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalWorkflowConfigUI;
