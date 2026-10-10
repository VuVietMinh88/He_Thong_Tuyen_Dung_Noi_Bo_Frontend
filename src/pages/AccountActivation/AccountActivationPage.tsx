import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosClient from "../../utils/axiosClient";
import axios from "axios";

export const AccountActivationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const activateAccount = async () => {
      try {
        const response = await axiosClient.post<{ message: string }>("/auth/activate-account", { token });
        setMessage(response.data?.message || "Kích hoạt thành công. Bạn có thể đăng nhập bằng mật khẩu tạm trong email.");
        setStatus("success");
      } catch (error) {
        setStatus("error");
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          setMessage(error.response.data.message);
        } else {
          setMessage("Đã có lỗi xảy ra khi kích hoạt tài khoản. Link kích hoạt có thể đã hết hạn hoặc không hợp lệ.");
        }
      }
    };

    activateAccount();
  }, [token]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10 text-center">
        {status === "loading" && (
          <>
            <div className="mb-6 flex justify-center">
              <svg
                className="h-12 w-12 animate-spin text-indigo-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Đang kích hoạt tài khoản...
            </h2>
            <p className="mt-3 text-sm text-slate-600">Vui lòng đợi trong giây lát.</p>
          </>
        )}

        {status === "invalid" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl shadow-sm text-red-600">
                ⚠️
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Liên kết không hợp lệ
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Không tìm thấy mã token trong đường dẫn. Vui lòng kiểm tra lại liên kết trong email của bạn.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl shadow-sm text-red-600">
                ❌
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Kích hoạt thất bại
            </h2>
            <p className="mt-3 text-sm text-slate-600">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl shadow-sm text-emerald-600">
                ✅
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Kích hoạt thành công
            </h2>
            <p className="mt-3 text-sm text-slate-600">{message}</p>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700"
              >
                Đăng nhập ngay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountActivationPage;

