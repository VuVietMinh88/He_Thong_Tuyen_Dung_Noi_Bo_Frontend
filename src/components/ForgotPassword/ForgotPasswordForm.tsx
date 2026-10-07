import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/auth.service";
import axios from "axios";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const getSubmitErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 400 || status === 404 || status === 422) {
        return "Email không hợp lệ hoặc không tồn tại trong hệ thống.";
      }
      if (status === 429) {
        return "Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau vài phút.";
      }
      if (status === 503 || status === 500) {
        return "Hệ thống đang bận. Vui lòng thử lại sau.";
      }
      return "Không thể gửi liên kết đặt lại mật khẩu. Vui lòng thử lại sau.";
    }
    
    if (error instanceof Error) {
      if (error.message === "NETWORK_ERROR" || error.message.includes("Network Error")) {
        return "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.";
      }
    }

    return "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setEmailError("Vui lòng nhập email công ty");
      setSubmitError("");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setEmailError(
        "Email không hợp lệ. Vui lòng nhập đúng định dạng (vd: ten@congty.com)",
      );
      setSubmitError("");
      return;
    }

    setEmailError("");
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await authService.requestPasswordReset(normalizedEmail);
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error));
      setIsSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl shadow-sm">
            ✅
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">
            Gửi liên kết thành công
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Nếu email tồn tại trong hệ thống, hệ thống đã gửi liên kết đặt lại
            mật khẩu có hiệu lực trong 30 phút.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
          <p className="font-medium">Hướng dẫn tiếp theo:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-emerald-700/90">
            <li>Kiểm tra hộp thư đến của bạn.</li>
            <li>Kiểm tra cả mục Spam / Promotions nếu cần.</li>
            <li>Nhấn vào liên kết trong email để đặt lại mật khẩu.</li>
          </ul>
        </div>

        <div className="mt-8">
          <Link
            to="/login"
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl shadow-sm">
          🔐
        </div>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-800">
          Quên mật khẩu
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Nhập email công ty để nhận liên kết đặt lại mật khẩu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="forgot-email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Email công ty
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError("");
            }}
            placeholder="nhansu@congty.com"
            className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
              emailError
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
            }`}
            disabled={isSubmitting}
            autoComplete="email"
          />

          {emailError && (
            <p className="mt-2 flex items-center text-xs font-medium text-red-500">
              <span className="mr-1">⚠</span>
              {emailError}
            </p>
          )}
        </div>

        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <svg
                className="mr-3 h-5 w-5 animate-spin text-white"
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
              Đang gửi liên kết...
            </>
          ) : (
            "Gửi liên kết đặt lại mật khẩu"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
