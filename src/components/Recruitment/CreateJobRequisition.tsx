import React, { useState } from "react";
import JobRequisitionBasicUI from "./JobRequisitionBasicUI";
import JobRequisitionDetailsUI from "./JobRequisitionDetailsUI";
import { jobRequisitionService, type CreateJobRequisitionPayload } from "../../services/jobRequisitionService";
import { Loader2 } from "lucide-react";

export const CreateJobRequisition: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [basicData, setBasicData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNextStep = (data: any) => {
    setBasicData(data);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleCancel = () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy? Các thay đổi sẽ không được lưu.")) {
      console.log("Cancelled create job requisition");
    }
  };

  const mapDepartmentToId = (deptName: string): number => {
    switch (deptName) {
      case "IT": return 1;
      case "HR": return 2;
      case "Marketing": return 3;
      default: return 1;
    }
  };

  const mapToEnumFormat = (value: string): string => {
    return value.toUpperCase().replace("-", "_");
  };

  const handleSubmitComplete = async (detailsData: any) => {
    if (!basicData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateJobRequisitionPayload = {
        jobTitle: basicData.jobTitle,
        departmentId: mapDepartmentToId(basicData.department),
        level: mapToEnumFormat(basicData.level),
        jobType: mapToEnumFormat(basicData.jobType),
        expectedJoinDate: basicData.expectedJoinDate,
        headcount: basicData.headcount,
        description: detailsData.jobDescription,
        requirements: detailsData.requirements,
        benefits: detailsData.benefits,
        isOverride: basicData.isOverride,
        overrideReason: basicData.overrideReason,
      };

      await jobRequisitionService.createJobRequisition(payload);
      alert("Tạo yêu cầu tuyển dụng thành công!");
      
    } catch (err: any) {
      setError(err?.response?.data?.message || "Đã có lỗi xảy ra khi gọi API tạo yêu cầu tuyển dụng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 py-8">
      {/* Overlay for loading */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-xl">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-600" strokeWidth={3} />
            <p className="font-semibold text-slate-800">Đang xử lý...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-auto mb-6 max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm animate-in fade-in slide-in-from-top-2">
            <p className="font-medium">Lỗi: {error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <JobRequisitionBasicUI 
            onNext={handleNextStep} 
            onCancel={handleCancel} 
          />
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <JobRequisitionDetailsUI 
            onBack={handleBack} 
            onSubmitComplete={handleSubmitComplete} 
          />
        </div>
      )}
    </div>
  );
};

export default CreateJobRequisition;
