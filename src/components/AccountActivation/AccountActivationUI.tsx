import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

type ActivationState = "loading" | "success" | "error";

// Mock API for testing
const mockActivateAPI = (token: string): Promise<{ success: boolean; message?: string }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate validation
      if (!token || token.trim() === "") {
        reject(new Error("Mã kích hoạt không hợp lệ hoặc không tồn tại."));
      } else if (token === "invalid-token") {
        reject(new Error("Kích hoạt thất bại. Link có thể đã hết hạn."));
      } else {
        resolve({ success: true });
      }
    }, 2000);
  });
};

export const AccountActivationUI: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ActivationState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("Không tìm thấy mã kích hoạt trên URL.");
      return;
    }

    // Call Mock API
    mockActivateAPI(token)
      .then(() => {
        setStatus("success");
      })
      .catch((err: Error) => {
        setStatus("error");
        setErrorMessage(err.message || "Kích hoạt thất bại. Link có thể đã hết hạn.");
      });
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
        
        {/* Loading State */}
        {status === "loading" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="mb-6 rounded-full bg-indigo-50 p-4 text-indigo-600">
              <Loader2 className="h-12 w-12 animate-spin" strokeWidth={2.5} />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              Đang xác thực
            </h2>
            <p className="text-base text-slate-500">
              Vui lòng đợi trong giây lát, chúng tôi đang xác thực thông tin tài khoản của bạn...
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 rounded-full bg-emerald-50 p-4 text-emerald-500">
              <CheckCircle className="h-14 w-14" strokeWidth={2.5} />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              Kích hoạt thành công!
            </h2>
            <p className="mb-8 text-base text-slate-600">
              Tài khoản của bạn đã được kích hoạt thành công. Bạn đã có thể đăng nhập và trải nghiệm hệ thống.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              Quay lại trang Đăng nhập
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 rounded-full bg-rose-50 p-4 text-rose-500">
              <XCircle className="h-14 w-14" strokeWidth={2.5} />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              Kích hoạt thất bại
            </h2>
            <p className="mb-8 text-base text-slate-600">
              {errorMessage}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
              Quay lại trang Đăng nhập
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AccountActivationUI;
