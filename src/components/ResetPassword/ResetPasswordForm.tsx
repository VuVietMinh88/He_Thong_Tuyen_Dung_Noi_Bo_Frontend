import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../services/auth.service";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const ResetPasswordForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasToken = token.trim().length > 0;

  const validatePassword = (): boolean => {
    if (!newPassword) {
      setPasswordError("Vui lòng nhập mật khẩu mới");
      return false;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setPasswordError("Mật khẩu mới tối thiểu 8 ký tự, phải có chữ và số");
      return false;
    }

    setPasswordError("");

    if (!confirmPassword) {
      setConfirmError("Vui lòng xác nhận mật khẩu mới");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError("Mật khẩu xác nhận không khớp");
      return false;
    }

    setConfirmError("");
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitError("");

    if (!hasToken) {
      setSubmitError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
      return;
    }

    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPassword(token, newPassword);
      setIsSuccess(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "RESET_PASSWORD_FAILED";

      if (message === "INVALID_OR_EXPIRED_TOKEN") {
        setSubmitError(
          "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi lại link mới.",
        );
        return;
      }

      if (message === "PASSWORD_INVALID") {
        setSubmitError(
          "Mật khẩu mới không đáp ứng yêu cầu bảo mật của hệ thống.",
        );
        return;
      }

      setSubmitError(
        "Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl shadow-sm">
            ✅
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">
            Đổi mật khẩu thành công
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể đăng nhập
            ngay bằng mật khẩu mới.
          </p>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl shadow-sm">
          🔒
        </div>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-800">
          Đặt lại mật khẩu
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      {!hasToken && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
        </div>
      )}

      {submitError && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="new-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Mật khẩu mới
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setPasswordError("");
                setSubmitError("");
              }}
              placeholder="Nhập mật khẩu mới"
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                passwordError
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
              }`}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
              onClick={() => setShowNewPassword((current) => !current)}
              tabIndex={-1}
            >
              {showNewPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {passwordError && (
            <p className="mt-2 text-xs font-medium text-red-500">
              {passwordError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setConfirmError("");
                setSubmitError("");
              }}
              placeholder="Nhập lại mật khẩu mới"
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                confirmError
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
              }`}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
              onClick={() => setShowConfirmPassword((current) => !current)}
              tabIndex={-1}
            >
              {showConfirmPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {confirmError && (
            <p className="mt-2 text-xs font-medium text-red-500">
              {confirmError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !hasToken}
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
              Đang cập nhật mật khẩu...
            </>
          ) : (
            "Xác nhận đặt lại mật khẩu"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
        >
          Yêu cầu gửi lại link mới
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
