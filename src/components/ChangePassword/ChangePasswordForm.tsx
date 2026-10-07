import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { tokenService } from "../../services/token.service";

const PASSWORD_REGEX = /^(?=.*\p{L})(?=.*\d).{8,72}$/u;

const isPasswordWithinByteLimit = (password: string): boolean =>
  new TextEncoder().encode(password).length <= 72;

export const ChangePasswordForm: React.FC = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!currentPassword.trim()) {
      setCurrentPasswordError("Vui lòng nhập mật khẩu hiện tại");
      isValid = false;
    } else {
      setCurrentPasswordError("");
    }

    if (!newPassword) {
      setNewPasswordError("Vui lòng nhập mật khẩu mới");
      isValid = false;
    } else if (
      !PASSWORD_REGEX.test(newPassword) ||
      !isPasswordWithinByteLimit(newPassword)
    ) {
      setNewPasswordError(
        "Mật khẩu mới phải có tối thiểu 8 ký tự, tối đa 72 ký tự, có chữ và số.",
      );
      isValid = false;
    } else {
      setNewPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu mới");
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.changePassword(currentPassword, newPassword);

      try {
        await authService.logout();
      } catch (logoutError) {
        console.warn("Logout failed after password change", logoutError);
      }

      tokenService.clearAll();
      setIsSuccess(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "CHANGE_PASSWORD_FAILED";

      if (message === "INVALID_CURRENT_PASSWORD") {
        setSubmitError("Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.");
        return;
      }

      if (message === "PASSWORD_INVALID") {
        const fieldMessage =
          error instanceof Error && "fieldMessage" in error
            ? (error as Error & { fieldMessage?: string }).fieldMessage
            : undefined;

        setSubmitError(
          fieldMessage ??
            "Mật khẩu mới không đáp ứng yêu cầu bảo mật của hệ thống.",
        );
        return;
      }

      setSubmitError("Không thể đổi mật khẩu lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
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
            Mật khẩu của bạn đã được cập nhật thành công. Hệ thống đã thu hồi
            phiên đăng nhập hiện tại để bảo mật, nên bạn cần đăng nhập lại để
            tiếp tục sử dụng.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
          <p className="font-medium">Lưu ý bảo mật:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-emerald-700/90">
            <li>Phiên hiện tại đã được vô hiệu hóa.</li>
            <li>Refresh token trên server đã được thu hồi.</li>
            <li>Vui lòng đăng nhập lại để tiếp tục làm việc.</li>
          </ul>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700"
          >
            Đăng nhập lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl shadow-sm">
          🔑
        </div>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-800">
          Đổi mật khẩu
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Bảo vệ tài khoản của bạn bằng mật khẩu mới mạnh hơn và an toàn hơn.
        </p>
      </div>

      {submitError && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="current-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setCurrentPasswordError("");
                setSubmitError("");
              }}
              placeholder="Nhập mật khẩu hiện tại"
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                currentPasswordError
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
              }`}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
              onClick={() => setShowCurrentPassword((current) => !current)}
              tabIndex={-1}
            >
              {showCurrentPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {currentPasswordError && (
            <p className="mt-2 text-xs font-medium text-red-500">
              {currentPasswordError}
            </p>
          )}
        </div>

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
                setNewPasswordError("");
                setSubmitError("");
              }}
              placeholder="Nhập mật khẩu mới"
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                newPasswordError
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
          {newPasswordError && (
            <p className="mt-2 text-xs font-medium text-red-500">
              {newPasswordError}
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
                setConfirmPasswordError("");
                setSubmitError("");
              }}
              placeholder="Nhập lại mật khẩu mới"
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                confirmPasswordError
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
          {confirmPasswordError && (
            <p className="mt-2 text-xs font-medium text-red-500">
              {confirmPasswordError}
            </p>
          )}
        </div>

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
              Đang cập nhật mật khẩu...
            </>
          ) : (
            "Cập nhật mật khẩu"
          )}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
