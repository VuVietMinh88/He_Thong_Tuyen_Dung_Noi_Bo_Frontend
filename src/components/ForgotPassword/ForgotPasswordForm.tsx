import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authService, AccountBlockedError } from "../../services/auth.service";
import { useToast } from "../notifications/useToast";
import { EmailFooter } from "../common/EmailFooter";
import axios from "axios";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FAILED_ATTEMPTS = 5;
const STORAGE_KEY_ATTEMPTS = "forgot_pwd_failed_attempts";
const STORAGE_KEY_LOCK_UNTIL = "forgot_pwd_locked_until";
const LOCK_DURATION_MS = 15 * 60 * 1000; // Khóa 15 phút

export const ForgotPasswordForm: React.FC = () => {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [remainingLockMinutes, setRemainingLockMinutes] = useState<number>(15);

  // Khởi tạo kiểm tra trạng thái khóa từ localStorage
  useEffect(() => {
    const checkLockStatus = () => {
      const lockUntil = localStorage.getItem(STORAGE_KEY_LOCK_UNTIL);
      if (lockUntil) {
        const lockTime = parseInt(lockUntil, 10);
        const now = Date.now();
        if (lockTime > now) {
          const diffMinutes = Math.ceil((lockTime - now) / (60 * 1000));
          setIsBlocked(true);
          setRemainingLockMinutes(diffMinutes);
          setSubmitError(
            `Bạn đã nhập sai quá ${MAX_FAILED_ATTEMPTS} lần liên tiếp. Tính năng đặt lại mật khẩu đã bị tạm khóa trong ${diffMinutes} phút để bảo vệ an toàn tài khoản.`
          );
          return;
        } else {
          // Đã hết thời gian khóa
          localStorage.removeItem(STORAGE_KEY_LOCK_UNTIL);
          localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
          setIsBlocked(false);
          setFailedCount(0);
        }
      }

      const storedCount = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
      if (storedCount) {
        const count = parseInt(storedCount, 10);
        setFailedCount(count);
        if (count >= MAX_FAILED_ATTEMPTS) {
          triggerBlock();
        }
      }
    };

    checkLockStatus();
  }, []);

  const triggerBlock = () => {
    const lockUntil = Date.now() + LOCK_DURATION_MS;
    localStorage.setItem(STORAGE_KEY_LOCK_UNTIL, lockUntil.toString());
    setIsBlocked(true);
    setRemainingLockMinutes(15);
    const msg = `Bạn đã nhập sai quá ${MAX_FAILED_ATTEMPTS} lần liên tiếp. Tính năng đặt lại mật khẩu đã bị tạm khóa trong 15 phút để bảo mật. Vui lòng liên hệ Admin hoặc Bộ phận Nhân sự nếu cần trợ giúp khẩn cấp.`;
    setSubmitError(msg);
    addToast({ type: "error", message: msg });
  };

  const recordFailedAttempt = () => {
    const newCount = failedCount + 1;
    setFailedCount(newCount);
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, newCount.toString());

    if (newCount >= MAX_FAILED_ATTEMPTS) {
      triggerBlock();
    }
  };

  const getSubmitErrorMessage = (error: unknown): string => {
    if (
      error instanceof AccountBlockedError ||
      (error instanceof Error && error.name === "AccountBlockedError")
    ) {
      triggerBlock();
      return `Tài khoản của bạn đã bị tạm chặn do nhập sai quá ${MAX_FAILED_ATTEMPTS} lần. Vui lòng liên hệ Admin / Bộ phận Nhân sự.`;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 429 || status === 403) {
        triggerBlock();
        return `Tài khoản của bạn đã bị tạm chặn do nhập sai quá ${MAX_FAILED_ATTEMPTS} lần. Vui lòng liên hệ Admin / Bộ phận Nhân sự.`;
      }
      if (status === 400 || status === 404 || status === 422) {
        recordFailedAttempt();
        const remain = MAX_FAILED_ATTEMPTS - (failedCount + 1);
        if (remain > 0) {
          return `Email không tồn tại trong hệ thống. Bạn còn ${remain} lần thử trước khi bị tạm khóa.`;
        }
        return `Email không tồn tại trong hệ thống. Đã vượt quá ${MAX_FAILED_ATTEMPTS} lần thử.`;
      }
      if (status === 503 || status === 500) {
        return "Hệ thống đang bận. Vui lòng thử lại sau.";
      }
      return "Không thể gửi liên kết đặt lại mật khẩu. Vui lòng thử lại sau.";
    }

    if (error instanceof Error) {
      if (error.message === "RATE_LIMITED" || error.message === "ACCOUNT_BLOCKED") {
        triggerBlock();
        return `Tài khoản của bạn đã bị tạm chặn do nhập sai quá ${MAX_FAILED_ATTEMPTS} lần. Vui lòng liên hệ Admin.`;
      }
      if (error.message === "NETWORK_ERROR" || error.message.includes("Network Error")) {
        return "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.";
      }
      if (error.message === "EMAIL_INVALID") {
        recordFailedAttempt();
        return "Email không hợp lệ hoặc không tồn tại trong hệ thống.";
      }
      if (error.message === "SERVER_UNAVAILABLE") {
        return "Hệ thống đang bận. Vui lòng thử lại sau.";
      }
      return error.message;
    }

    return "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isBlocked) {
      addToast({
        type: "error",
        message: `Bạn đang bị tạm khóa. Vui lòng đợi hết ${remainingLockMinutes} phút hoặc liên hệ Admin.`,
      });
      return;
    }

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      const msg = "Vui lòng nhập email công ty";
      setEmailError(msg);
      addToast({ type: "warning", message: msg });
      setSubmitError("");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      recordFailedAttempt();
      const remain = MAX_FAILED_ATTEMPTS - (failedCount + 1);
      const msg = `Email không đúng định dạng (vd: ten@congty.com).${remain > 0 ? ` Còn lại ${remain} lần thử.` : ""}`;
      setEmailError(msg);
      addToast({ type: "warning", message: msg });
      setSubmitError("");
      return;
    }

    setEmailError("");
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await authService.requestPasswordReset(normalizedEmail);
      // Reset số lần sai khi thành công
      localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      localStorage.removeItem(STORAGE_KEY_LOCK_UNTIL);
      setFailedCount(0);
      setIsSubmitted(true);
      addToast({
        type: "success",
        message: "Hệ thống đã gửi liên kết đặt lại mật khẩu về email của bạn!",
      });
    } catch (error) {
      const errorMessage = getSubmitErrorMessage(error);
      setSubmitError(errorMessage);
      addToast({ type: "error", message: errorMessage });
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

        {/* Footer email hỗ trợ và Logo */}
        <EmailFooter />
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
              isBlocked
                ? "border-slate-200 bg-slate-100 cursor-not-allowed text-slate-400"
                : emailError
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
            }`}
            disabled={isSubmitting || isBlocked}
            autoComplete="email"
          />

          {emailError && !isBlocked && (
            <p className="mt-2 flex items-center text-xs font-medium text-red-500">
              <span className="mr-1">⚠</span>
              {emailError}
            </p>
          )}

          {failedCount > 0 && !isBlocked && (
            <p className="mt-2 text-xs text-amber-600 font-medium">
              Cảnh báo: Bạn đã nhập sai {failedCount}/{MAX_FAILED_ATTEMPTS} lần. Nhập sai {MAX_FAILED_ATTEMPTS} lần sẽ bị tạm khóa 15 phút.
            </p>
          )}
        </div>

        {submitError && (
          <div
            role="alert"
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm font-medium shadow-sm ${
              isBlocked
                ? "border-rose-400 bg-rose-50 text-rose-900"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            <span className="text-lg leading-none shrink-0" aria-hidden="true">
              {isBlocked ? "🚫" : "⚠️"}
            </span>
            <div className="flex-1">{submitError}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isBlocked}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          ) : isBlocked ? (
            "Tài khoản đang bị tạm khóa"
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

      {/* Footer thông tin hỗ trợ và Logo công ty */}
      <EmailFooter />
    </div>
  );
};

export default ForgotPasswordForm;
